"use strict";
const express = require('express');
const router = express.Router();
const moment = require('moment');
const fs = require('fs-extra');
const path = require('path');
const PDFDocument = require('../utils/PDFDocumentsWithTable');
const mongoose = require('mongoose');

const Assembly = require('../models/Assembly');
const Laboratory = require('../models/Laboratory');
const Student = require('../models/Student');
const Subscribed = require('../models/Subscribed');
const Log = require('../models/Log');

const authUser = require('../utils/AuthUser');
const { isAdmin, isStudent } = require('../utils/CheckUserType');

const assembliesBackups = path.join(__dirname, '../backups');
const assembliesPdfs = path.join(__dirname, '../pdfs');

/**
 * Get assembly info
 * @method get
 * @public
 */
router.get('/info', (req, res, next) =>
    Assembly.find()
        .then(results => {
            let noAssemblyError = new Error('Nessuna assemblea in programma');
            noAssemblyError.code = 0;
            noAssemblyError.status = 200;
            if (results.length === 0) {
                throw noAssemblyError;
            } else {
                let assembly = results[0];
                if (moment(assembly.date).diff(moment()) < 0) {
                    throw noAssemblyError;
                } else {
                    let response = {
                        code: -1,
                        message: null,
                        info: assembly.toObject()
                    };
                    
                    if (moment(assembly.subscription.open).diff(moment()) > 0) {
                        response.code = 1;
                        response.message = 'La iscrizioni sono attualmente chiuse, torna più tardi';
                    } else {
                        if (moment(assembly.subscription.close).diff(moment()) > 0) {
                            response.code = 2;
                        } else {
                            response.code = 3;
                            response.message = 'La iscrizioni sono terminate';
                        }
                    }

                    res.status(200).json(response);
                }
            }
        })
        .catch(err => next(err))
);

// Filter next routes, requesting the user to be authenticated
router.use('*', authUser);

/**
 * Get assembly general info (admin dashboard)
 * @method get
 * @public
 */
router.get('/', isAdmin, (req, res, next) => {
    
    let labs;
    let students;
    let subs;

    Laboratory.estimatedDocumentCount()
        .then(result => {
            labs = result;
            return Student.estimatedDocumentCount();
        })
        .then(result => {
            students = result;
            return Subscribed.estimatedDocumentCount();
        })
        .then(result => {
            subs = result;
            return Assembly.find();
        })
        .then(results => 
            res.status(200)
                .json({
                    code: results.length > 0 ? 1 : 0,
                    info: results.length > 0 ? results[0] : null,
                    labs,
                    students,
                    subs
                })
        )
        .catch(err => 
            res.status(err.status || 500)
                .json({
                    code: err.code !== undefined ? err.code : -1,
                    message: err.message,
                    labs,
                    students
                })
        );
});

/**
 * Delete assembly
 * @method post
 * @param {string} password
 * @public
 */
router.delete('/', isAdmin, (req, res, next) => {
    Assembly
        .deleteMany({})
        .then(() => Laboratory.deleteMany({}))
        .then(() => Subscribed.deleteMany({}))
        .then(() => new Log({
            user: 'Rappresentanti',
            message: 'Assembly deleted',
            type: 'INFO'
        }).save())
        .then(() => 
            res
                .status(200)
                .json({ 
                    code: 1
                })
        )
        .catch(err => next(err));
});

/**
 * Get avabile backups
 * @method get
 * @public
 */
router.get('/backups', isAdmin, (req, res, next) => {
    if (!fs.existsSync(assembliesBackups)){
        fs.mkdirSync(assembliesBackups);
        res.status(200)
            .json({
                code: 1,
                backups: []
            });
    } else {
        let files;
        fs.readdir(assembliesBackups)
            .then(result => {
                files = result;
                let promiseArray = [];
                files.forEach(file => promiseArray.push(
                    fs.readFile(
                        path.join(assembliesBackups, file)
                    )
                ));
                return Promise.all(promiseArray);
            })
            .then(results => {
                files = files.map((file, index) => {
                    const { info } = JSON.parse(results[index])
                    if (info) {
                        return {
                            _id: info._id,
                            title: info.title,
                            fileName: file    
                        };
                    } else {
                        return {
                            _id: 'Sconosciuto',
                            title: 'Sconosciuto',
                            fileName: file
                        };
                    }
                });
                res.status(200)
                    .json({
                        code: 1,
                        backups: files
                    })
            })
            .catch(err => next(err));
    }
});

/**
 * Backup assembly into JSON local file
 * @method post
 * @public
 */
router.post('/backups', isAdmin, (req, res, next) => {
    let info;
    Assembly.find()
        .then(results => {
            info = results[0];
            return Laboratory.find();
        })
        .then(labs => {
            if (!fs.existsSync(assembliesBackups)){
                fs.mkdirSync(assembliesBackups);
            }
            const file = path.join(assembliesBackups, info._id + '.json');

            const assembly = {
                info,
                labs
            };
            
            return fs.writeFile(file, JSON.stringify(assembly, null, 4), 'utf8');
        })
        .then(() => new Log({
            user: 'Rappresentanti',
            message: 'Assembly backup created',
            type: 'INFO'
        }).save())
        .then(() => 
            res.status(200)
                .json({
                code: 1,
                message: 'Assemblea salvata con successo'
            })
        )
        .catch(err => next(err));
});

/**
 * Load assembly from local backup file
 * @method post
 * @param {string} fileName
 * @public
 */
router.post('/backups/load', isAdmin, (req, res, next) => {
    const { fileName } = req.body;
    if (typeof fileName === 'string') {
        const file = path.join(assembliesBackups, fileName);
        let assemblyFile;
        let newAssembly = {};
        fs.readFile(file)
            .then(data => {
                assemblyFile = JSON.parse(data);
                let { info } = assemblyFile;
                delete info._id;
                return new Assembly(info).save();
            })
            .then(info => {
                newAssembly.info = info;
                let promiseArray = [];
                assemblyFile.labs.forEach(lab => 
                    promiseArray.push(
                        new Laboratory(lab).save()
                    )
                );
                return Promise.all(promiseArray);
            })
            .then(results => {
                newAssembly.labs = results;
                return new Log({
                    user: 'Rappresentanti',
                    message: `Assembly loaded from file (${fileName})`,
                    type: 'INFO'
                }).save();
            })
            .then(() => 
                res.status(200)
                    .json({
                        code: 1,
                        assembly: newAssembly
                    })
            )
            .catch(err => next(err));
    } else {
        next(new Error('Identificativo non valido'));
    }
});

/**
 * Delete backup file on the server
 * @method delete
 * @param {string} fileName
 */
router.delete('/backups', isAdmin, (req, res, next) => {
    const { fileName } = req.body;
    if (typeof fileName === 'string') {
        const file = path.join(assembliesBackups, fileName);
        fs.unlink(file)
            .then(() => new Log({
                user: 'Rappresentanti',
                message: 'Assembly backup deleted',
                type: 'INFO'
            }).save())
            .then(() => 
                res.status(200).json({
                    code: 1,
                    message: 'Backup eliminato con successo'
                })
            )
            .catch(err => next(err))
    } else {
        next(new Error('Identificativo non valido'));
    }
});

/**
 * Export assembly into PDF file
 * @method get
 * @public
 */
router.get('/export', isAdmin, (req, res, next) => {
    if (!fs.existsSync(assembliesPdfs)){
        fs.mkdirSync(assembliesPdfs);
    }
    const doc = new PDFDocument;
    let file;
    let info;
    let labs;
    let students;
    let stream;
    Assembly.find()
        .then(results => {
            info = results[0];
            file = path.join(assembliesPdfs, info._id + '.pdf');
            stream = doc.pipe(fs.createWriteStream(file));
            return Laboratory.find();
        })
        .then(results => {
            labs = results;
            return Student.find();
        })
        .then(results => {
            students = results.map(std => std.toObject());
            return Subscribed.find();
        })
        .then(subs => {
            subs = subs.map(sub => {
                let std = students.find(s => s.studentId === sub.studentId) || null;
                return {
                    ...std,
                    labs: (sub.toObject()).labs
                };
            });

            labs.forEach((lab, index, arr) => {
                for (let i = 0; i < info.tot_h; i++) {
                    let labStudents = [];
                    subs.filter(
                        sub =>  sub.labs[i] ? sub.labs[i].equals(lab._id) : false
                    ).forEach(
                        sub => labStudents.push([
                            sub.name, 
                            sub.surname, 
                            sub.section
                        ])
                    );

                    if (labStudents.length !== 0) {
                        doc.fontSize(24).text(lab.title + ' - ora ' + (i + 1)).fontSize(16);
                        doc.moveDown().table({
                            headers: ['Nome', 'Cognome', 'Classe'],
                            rows: labStudents
                        }).moveDown();

                        if (i !== info.tot_h && index !== (arr.length - 1)) {
                            doc.addPage();
                        }
                    }

                }
            });
            doc.end();
            stream.on('finish', () => {
                const data = fs.readFileSync(file);
                new Log({
                    user: 'Rappresentanti',
                    message: 'Assembly exported to PDF',
                    type: 'INFO'
                }).save()
                .finally(() => 
                    res.status(200)
                        .contentType('application/pdf')
                        .end(data)
                );
            });
        })
        .catch(err => next(err));
});

/**
 * Update assembly info
 * @method put
 * @param {object} info
 * @public
 */
router.put('/info', isAdmin, (req, res, next) => {
    let { 
        _id, 
        title, 
        date, 
        subOpen, 
        subClose,
        tot_h,
        sections 
    } = req.body.info;
    tot_h = +tot_h || -1;

    // Check if parameters are valid
    if (
        typeof _id === 'string' && _id.trim() !== '' &&
        typeof title === 'string' && title.trim() !== '' &&
        typeof date === 'string' && date.trim() !== '' &&
        typeof subOpen === 'string' && subOpen.trim() !== '' &&
        typeof subClose === 'string' && subClose.trim() !== '' &&
        tot_h !== -1 &&
        sections.length > 0
    ) {
        let info;
        Assembly.findByIdAndUpdate(_id, {
            title, date,
            subscription: {
                open: moment(subOpen).toDate(),
                close: moment(subClose).toDate()
            },
            tot_h, sections
        }, { new: true })
            .then(result => {
                if (result) {
                    info = result;
                    return new Log({
                        user: 'Rappresentanti',
                        message: 'Assembly info updated',
                        type: 'INFO'
                    }).save();
                } else {
                    throw new Error('Assemblea non trovata (id: ' + _id + ')');
                }
            })
            .then(() => 
            res.status(200)
                .json({
                    code: 1,
                    info
                })
            )
            .catch(err => next(err));
    } else {
        next(new Error('Parametri non accettati'));
    }
});

/**
 * Create assembly info
 * @method put
 * @param {object} info
 * @public
 */
router.post('/info', isAdmin, (req, res, next) => {
    const { info } = req.body;
    info.subscription = {
        open: info.subOpen,
        close: info.subClose,
    };
    let assembly;

    new Assembly(info).save()
        .then(result => {
            assembly = result;
            return new Log({
                user: 'Rappresentanti',
                message: 'Assembly info created',
                type: 'INFO'
            }).save();
        })
        .then(() => {
            res.status(200)
                .json({
                    code: 1,
                    info: assembly
                })
        })
        .catch(err => next(err));
});

/**
 * Get assembly laboratories
 * @method get
 * @param {string} action
 * @param {string=} section
 * @public
 */
router.get('/labs', isStudent, (req, res, next) => {
    const { action } = req.query;
    if (action === 'count') {
        Laboratory
            .countDocuments()
            .then(c => 
                res.status(200)
                    .json({
                        code: 1,
                        labs: c
                    })
            )
            .catch(err => next(err));
    } else if (action === 'getAll') {
        Laboratory.find()
            .then(labs =>
                res.status(200)
                    .json({
                        code: 1,
                        labList: labs
                    })
            )
            .catch(err => next(err));
    } else {
        next(new Error('Parametri non accettati'));
    }
});

/**
 * Update assembly laboratory
 * @method put
 * @param {object} lab
 * @public
 */
router.put('/labs', isAdmin, (req, res, next) => {
    const { lab } = req.body;
    if (lab) {
        let updatedLab;
        Laboratory.findByIdAndUpdate(lab._id, lab, { new: true })
            .then(result => {
                if (result) {
                    updatedLab = result;
                    return new Log({
                        user: 'Rappresentanti',
                        message: `Laboratory ${lab._id} updated`,
                        type: 'INFO'
                    }).save();
                } else {
                    throw new Error('Laboratorio non trovato (' + lab._id + ')');
                }
            })
            .then(() =>
                res.status(200)
                    .json({
                        code: 1,
                        lab: updatedLab
                    })
            )
            .catch(err => next(err));
    } else {
        next(new Error('Parametri non accettati'));
    }
});

/**
 * Create assembly laboratory
 * @method post
 * @param {object} lab
 * @public
 */
router.post('/labs', isAdmin, (req, res, next) => {
    const { lab } = req.body;
    if (lab) {
        let createdLab;
        new Laboratory(lab).save()
            .then(result => {
                createdLab = result;
                return new Log({
                    user: 'Rappresentanti',
                    message: `Laboratory ${lab._id} created`,
                    type: 'INFO'
                }).save();
            })
            .then(() => 
                res.status(200)
                    .json({
                        code: 1,
                        lab: createdLab
                    })
            )
            .catch(err => next(err));
    } else {
        next(new Error('Parametri non accettati'));
    }
});

/**
 * Delete assembly laboratory
 * @method delete
 * @param {number} ID
 * @public
 */
router.delete('/labs', isAdmin, (req, res, next) => {
    const { _id } = req.body;
    if (typeof _id === 'string') {
        let deletedLab;
        Laboratory.findByIdAndDelete(_id)
            .then(lab => {
                if (lab) {
                    deletedLab = lab;
                    return new Log({
                        user: 'Rappresentanti',
                        message: `Laboratory ${lab._id} deleted`,
                        type: 'INFO'
                    }).save();
                } else {
                    throw new Error('Laboratorio non trovato (' + _id + ')');
                }
            })
            .then(() => 
                res.status(200)
                    .json({
                        code: 1,
                        lab: deletedLab
                    })
            )
            .catch(err => next(err));
    } else {
        next(new Error('Parametri non accettati'));
    }
});

/**
 * Remove class from all labs
 * @method post
 * @param {int} h
 * @param {array} sections
 */
router.post('/labs/exclude', (req, res, next) => {
    const h = +req.body.h;
    const { sections } = req.body;

    if (h >= 0 && sections && sections.length > 0) {
        let info;
        let labsIds;
        let updatedLabs;
        Assembly.find()
            .then(result => {
                info = result[0];
                if (h >= info.tot_h) {
                    throw new Error('Parametro h non accettato');
                }
                return Laboratory.find();
            })
            .then(labs => {
                let promiseArray = [];
                labs.forEach(lab => {
                    let labSections = lab.info[h].sections;
                    labsIds.push(lab._id);
                    sections.forEach(section => {
                        // Check if selected section is included in lab sections
                        if (labSections.includes(section)) {
                            lab.info[h].sections = labSections.filter(
                                sec => sec !== section
                            );
                        } else if (!labSections.includes('-' + section)) {
                            // Check if lab sections includes all sections or sections of input sections
                            if (labSections.includes('@a') || labSections.includes('@' + section[0])) {
                                lab.info[h].sections.push('-' + section);
                            }
                        }
                    });
                    promiseArray.push(lab.save());
                });
                return Promise.all(promiseArray);
            })
            .then(result => {
                updatedLabs = result;
                return new Log({
                    user: 'Rappresentanti',
                    message: `Laboratories ${labsIds.join(', ')} updated (excluded sections)`,
                    type: 'INFO'
                }).save();
            })
            .then(() => 
                res.status(200).json({
                    code: 1,
                    labs: updatedLabs
                })
            )
            .catch(err => next(err));
    } else {
        next(new Error('Parametri non accettati'));
    }
});

/**
 * Get assembly students
 * @method get
 * @param {string} action
 * @public
 */
router.get('/students', isAdmin, (req, res, next) => {
    const { action } = req.query;
    if (action === 'count') {
        let stdCount;

        Student.estimatedDocumentCount()
            .then(c => {
                stdCount = c;
                return Subscribed.estimatedDocumentCount();
            })
            .then(c => 
                res.status(200)
                    .json({
                        code: 1,
                        students: stdCount,
                        subs: c
                    })
            )
            .catch(err => next(err));
    } else if (action === 'getAll') {
        let students;
        Student.find()
            .then(results => {
                students = results.map(std => std.toObject());
                return Subscribed.find();
            })
            .then(subs => {
                students = students.map(student => {
                    let sub = subs.find(s => s.studentId === student.studentId) || null;
                    student.labs = sub !== null ? {
                        ...sub.toObject(),
                        studentId: undefined
                    } : null;
                    return student;
                });
                res.status(200)
                    .json({
                        code: 1,
                        students
                    });
            })
            .catch(err => next(err));
    } else {
        next(new Error('Parametri non accettati'));
    }
});

/**
 * Get statistics about subscribers
 * @method get
 */
router.get('/stats', isAdmin, (req, res, next) => {
    let subscribeds;
    let students;

    Student.estimatedDocumentCount()
        .then(studentsCount => {
            students = studentsCount;
            return Subscribed.estimatedDocumentCount()
        })
        .then(subsCount => {
            subscribeds = subsCount;
            return Subscribed.countDocuments({
                labs: { $exists: true, $not: { $size: 0} }
            })
        })
        .then(subsPartCount => 
            res.status(200).json({
                code: 1,
                students,
                subscribeds: {
                    part: subsPartCount,
                    total: subscribeds
                }
            })
        )
        .catch(err => next(err));
});

module.exports = router;