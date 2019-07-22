import React, { Fragment } from "react";
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import { logout } from '../../../actions/adminActions';
import { withRouter } from "react-router-dom";
import { Site, Grid, Button, Icon, RouterContextProvider } from "tabler-react";
import moment from 'moment';
import "tabler-react/dist/Tabler.css";
import './c3jscustom.css';

import NavBarItems from './NavBarItems';

const SiteWrapper = ({ logout, children }) => (
    <Site.Wrapper
        headerProps={{
            href: "/gestore",
            alt: "TronWeb Logo",
            // imageURL: "https://www.tronweb.it/wp-content/uploads/2018/09/tw-logo.png", # Site currently down
            navItems: (
                <Button 
                    color="outline-primary" 
                    size="sm" 
                    onClick={logout}
                >
                    Esci {" "}
                    <Icon name="log-out" />
                </Button>
            )
        }}
        navProps={{ itemsObjects: NavBarItems }}
        routerContextComponentType={withRouter(RouterContextProvider)}
        footerProps={{
            copyright: (
                <Fragment>
                    Copyright © {moment().format('YYYY') } <a href="https://www.tronweb.it"> TronWeb</a> | Made by Davide Testolin
                </Fragment>
            ),
            nav: (
                <Fragment>
                    <Grid.Col auto={true}>
                        <Button
                            href="mailto://direzione.tronweb@gmail.com"
                            size="sm"
                            outline
                            color="primary"
                            RootComponent="a"
                        >
                            Aiuto
                        </Button>
                    </Grid.Col>
                </Fragment>
            ),
        }}
    >
        {children}
    </Site.Wrapper>
);

SiteWrapper.propTypes = {
    logout: PropTypes.func.isRequired
};

export default connect(() => ({}), { logout })(SiteWrapper);