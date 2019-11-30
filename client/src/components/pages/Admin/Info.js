import React, { useState, Fragment } from "react";
import { connect } from "react-redux";
import PropTypes from "prop-types";
import { Row, Col, Card, CardBody, Button } from "reactstrap";
import { updateAssemblyInfo } from "../../../actions/assemblyActions";
import { InfoForm, PageLoading, AdminAlert } from "../../Admin/";
import moment from "moment";
import InfoFormValidation from "../../../utils/InfoFormValidation";

const Info = ({ assembly, admin, updateAssemblyInfo }) => {
	const { pendings, info, stats } = assembly;

	const [edit, setEdit] = useState(false);
	const [displayMessage, setDisplayMessage] = useState({
		type: null,
		message: null
	});

	return (
		<Fragment>
			<AdminAlert
				display={displayMessage.message !== null}
				message={displayMessage.message}
				type={displayMessage.type}
			/>
            {pendings.assembly === false ||
             pendings.info === false ? (
				<Row>
					<Col xs="12">
						<Card>
							<CardBody>
								{assembly.exists === true ? (
									<InfoForm
										info={info}
										onSubmit={(
											values,
											{ setSubmitting, setErrors }
										) => {
											if (pendings.update_info !== true) {
                                                const errors = InfoFormValidation.validate(
                                                    values, 
                                                    info.sections, 
                                                    stats.labs
                                                );
												if (Object.entries(errors).length === 0) {
													updateAssemblyInfo({
														...values,
														subOpen: moment(
                                                            values.subOpenDate + " " + 
                                                            values.subOpenTime
                                                        ).format(),
														subClose: moment(
                                                            values.subCloseDate + " " + 
                                                            values.subCloseTime
                                                        ).format(),
														sections: values.sections.map(
															({ value }) => value
														)
													})
														.then(message =>
															setDisplayMessage({
																type: "success",
																message
															})
														)
														.catch(({ message }) =>
															setDisplayMessage({
																type: "danger",
																message
															})
														)
														.finally(() => {
															setEdit(false);
                                                            setSubmitting(false);
														});
												} else {
													setSubmitting(false);
													setErrors(errors);
												}
											}
										}}
										buttons={edit === true ? [
											<Button
												type="button"
												block
												onClick={() => {
													setEdit(false);
												}}
												outline
												color="danger"
											>
												Annulla
											</Button>,
											<Button
												type="submit"
												block
												color="primary"
												disabled={
													pendings.info === true
												}
											>
												Salva
											</Button>
										] : [
                                            <Button 
                                                block 
                                                color="primary" 
                                                onClick={() => setEdit(true)}
                                            >
					                                Modifica
				                            </Button>
                                        ]}
										setError={message =>
											setDisplayMessage({
												type: "danger",
												message
											})
										}
                                        authToken={admin.token}
                                        formDisabled={!edit}
									/>
								) : (
                                    <p>
                                        Devi creare un'assemblea prima di poter visualizzare le
                                        informazioni
                                    </p>
                                )}
							</CardBody>
						</Card>
					</Col>
				</Row>
			) : (
				<PageLoading />
			)}
		</Fragment>
	);
};

Info.propTypes = {
	assembly: PropTypes.object.isRequired,
	admin: PropTypes.object.isRequired,
	updateAssemblyInfo: PropTypes.func.isRequired
};

const mapStateToProps = state => ({
	assembly: state.assembly,
	admin: state.admin
});

export default connect(mapStateToProps, { updateAssemblyInfo })(Info);
