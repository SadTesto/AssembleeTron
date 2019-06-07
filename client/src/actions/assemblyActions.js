import {
    FETCH_ASSEMBLY_SUBS_CLOSE,
    FETCH_ASSEMBLY_SUBS_OPEN,
    FETCH_ASSEMBLY_NOT_AVABILE,
    FETCH_ASSEMBLY_ERROR,
    FETCH_ASSEMBLY_LABS,
    FETCH_ASSEMBLY_DONE,
    FETCH_ASSEMBLY_AVABILE_LABS,
    FETCH_ASSEMBLY_PENDING
} from '../actions/types.js';

export const fetchAssemblyInfo = () => dispatch => {
    dispatch({
        type: FETCH_ASSEMBLY_PENDING,
        payload: {
            info: true
        }
    });
    fetch('api/assembly/info')
    .then(resp => resp.json())
    .then(data => {
        switch (data.code) {
            case 0:
                dispatch({
                    type: FETCH_ASSEMBLY_NOT_AVABILE,
                    payload: {
                        message: data.message
                    }
                });
                break;
            case 1:
                dispatch({
                    type: FETCH_ASSEMBLY_SUBS_CLOSE,
                    payload: {
                        message: data.message
                    }
                });
                break;
            case 2:
                dispatch({
                    type: FETCH_ASSEMBLY_SUBS_OPEN,
                    payload: data.info
                });
                break;
            case 3:
                dispatch({
                    type: FETCH_ASSEMBLY_SUBS_CLOSE,
                    payload: {
                        message: data.message
                    }
                });
                break;
            default:
                dispatch({
                    type: FETCH_ASSEMBLY_ERROR,
                    payload: {
                        message: data.message || 'Errore non riconosciuto (assembly)'
                    }
                });
                break;
        }
    })
    .catch(err => dispatch({
        type: FETCH_ASSEMBLY_ERROR,
        payload: {
            message: err.message
        }
    }))
};

export const fetchAssemblyGeneral = () => dispatch => {
    dispatch({
        type: FETCH_ASSEMBLY_PENDING,
        payload: {
            admin_dashboard: true
        }
    });
    fetch('api/assembly/')
    .then(resp => resp.json())
    .then(data => {
        switch (data.code) {
            case 0:
                dispatch({
                    type: FETCH_ASSEMBLY_NOT_AVABILE,
                    payload: {
                        message: data.message
                    }
                });
                break;
            case 1:
            case 2:
            case 3:
                dispatch({
                    type: FETCH_ASSEMBLY_DONE,
                    payload: data
                });
                break;
            default:
                dispatch({
                    type: FETCH_ASSEMBLY_ERROR,
                    payload: {
                        message: data.message
                    }
                });
                break;
        }
    })
    .catch(err => dispatch({
        type: FETCH_ASSEMBLY_ERROR,
        payload: {
            message: err.message
        }
    }))
}

export const fetchAllLabs = () => dispatch => {
    dispatch({
        type: FETCH_ASSEMBLY_PENDING,
        payload: {
            labs: true
        }
    });
    fetch('api/assembly/labs?action=getAll')
    .then(resp => resp.json())
    .then(data => {
        if (data.code === 1) {
            dispatch({
                type: FETCH_ASSEMBLY_LABS,
                payload: data.labList
            })
        } else {
            dispatch({
                type: FETCH_ASSEMBLY_ERROR,
                payload: {
                    message: 'Errore inaspettato'
                }
            })
        }
    })
    .catch(err => dispatch({
        type: FETCH_ASSEMBLY_ERROR,
        payload: {
            message: err.message
        }
    }))
};