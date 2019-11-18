import React, { useState } from "react";
import { connect } from "react-redux";
import { deleteAssemblyLab } from "../../../actions/assemblyActions";
import PropTypes from "prop-types";
import { Page, Grid, Card, Button, Alert } from "tabler-react";
import { SiteWrapper, LabsTable, LabModal, PageLoading } from "../../Admin/";

const Labs = ({ 
    assembly, 
    deleteAssemblyLab 
}) => {
	const { labs, pendings } = assembly;

	const [displayMessage, setDisplayMessage] = useState({
		type: null,
		message: null
	});
	const [labDisplay, setLabDisplay] = useState({
		action: "create",
		lab: {}
	});
    const [showModal, setShowModal] = useState(false);

	return (
		<SiteWrapper>
			<Page.Content title="Laboratori">
				<Grid.Row>
					{displayMessage.message ? (
						<Grid.Col width={12}>
							<Alert type={displayMessage.type}>
								{displayMessage.message}
							</Alert>
						</Grid.Col>
					) : null}
				</Grid.Row>
                {pendings.assembly === false ? (
                    <React.Fragment>
                        <Grid.Row>
                            <Grid.Col width={12} xl={assembly.exists ? 9 : 12}>
                                <Card>
                                    <LabsTable
                                        labs={labs}
                                        setLabDisplay={setLabDisplay}
                                        deleteAssemblyLab={deleteAssemblyLab}
                                        setDisplayMessage={setDisplayMessage}
                                        setShowModal={setShowModal}
                                    />
                                </Card>
                            </Grid.Col>
                            {assembly.exists ? (
                                <Grid.Col width={12} xl={3}>
                                    <Card>
                                        <Card.Body>
                                            <Button
                                                type="button"
                                                color="success"
                                                block
                                                onClick={() => setShowModal(true)}
                                            >
                                                Crea
                                            </Button>
                                            <Button
                                                color="outline-warning"
                                                block
                                                onClick={() => alert("Not implemented yet")}
                                            >
                                                Controlla
                                            </Button>
                                        </Card.Body>
                                    </Card>
                                </Grid.Col>
                            ) : null}
                        </Grid.Row>
                        <LabModal
                            showModal={showModal}
                            handleClose={() => setShowModal(false)}
                            lab={labDisplay.lab}
                            action={labDisplay.action}
                            handleReset={() => setLabDisplay({ action: "create", lab: {} })}
                            setDisplayMessage={setDisplayMessage}
                            setLabDisplay={setLabDisplay}
                        />
                    </React.Fragment>
                ) : <PageLoading />}
			</Page.Content>
		</SiteWrapper>
	);
};

Labs.propTypes = {
	assembly: PropTypes.object.isRequired,
	deleteAssemblyLab: PropTypes.func.isRequired
};

const mapStateToProps = state => ({
	assembly: state.assembly
});

export default connect(mapStateToProps, { deleteAssemblyLab })(Labs);
