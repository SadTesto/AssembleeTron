import React, { Fragment } from "react";
import { NavLink, withRouter } from "react-router-dom";
import {
    Site,
    Grid,
    Button,
    RouterContextProvider,
} from "tabler-react";
import moment from 'moment';
import "tabler-react/dist/Tabler.css";
import './c3jscustom.css';

const navBarItems = [
    {
        value: "Home",
        to: "/gestore",
        icon: "home",
        LinkComponent: withRouter(NavLink),
        useExact: true,
    },
    {
        value: "Informazioni",
        to: "/informazioni",
        icon: "info",
        LinkComponent: withRouter(NavLink),
        useExact: true,
    },
    {
        value: "Laboratori",
        to: "/laboratori",
        icon: "list",
        LinkComponent: withRouter(NavLink),
        useExact: true,
    },
    {
        value: "Studenti",
        to: "/studenti",
        icon: "users",
        LinkComponent: withRouter(NavLink),
        useExact: true,
    }
];

const accountDropdownProps = {
    avatarURL: "https://www.tronweb.it/wp-content/uploads/2018/09/tw-logo.png",
    name: "TronWeb First Councilor",
    description: "Amministratore",
    options: [
        { icon: "user", value: "Profile" },
        { icon: "settings", value: "Settings" },
        { isDivider: true },
        { icon: "log-out", value: "Sign out" },
    ],
};

const SiteWrapper = ({ children }) => (
    <Site.Wrapper
        headerProps={{
            href: "/gestore",
            alt: "TronWeb Logo",
            imageURL: "https://www.tronweb.it/wp-content/uploads/2018/09/tw-logo.png",
            accountDropdown: accountDropdownProps,
        }}
        navProps={{
            itemsObjects: navBarItems,
            rightColumnComponent: (
                <NavLink to='/gestore/assemblea?elimina'>
                    <Button color="outline-danger" size="sm">
                        Elimina
                    </Button>
                </NavLink>
            )
        }}
        routerContextComponentType={withRouter(RouterContextProvider)}
        footerProps={{
            copyright: (
                <Fragment>
                    Copyright © {moment().format('YYYY') } <a href="https://www.tronweb.it"> TronWeb</a>. Theme by Davide Testolin.
                    All rights reserved.
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

export default SiteWrapper;
