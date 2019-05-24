import React from 'react';
import { Grid, Alert } from 'tabler-react';

const ErrorAlert = ({ message }) => (
    <Grid.Row>
        <Grid.Col>
            <Alert type="danger" className="mb-0" >{message}</Alert>
        </Grid.Col>
    </Grid.Row>
);

export default ErrorAlert;