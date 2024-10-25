import * as React from "react";
import { Box, Tabs, Tab } from "@mui/material";
import Profile from "../../components/Profile/Profile";
import Payment from "../../components/Payment/Payment";
import BillingAdress from "../../components/BillingAdress/BillingAdress";
import Account from "../../components/Account/Account";

interface CustomTabPanelProps {
    children?: React.ReactNode;
    index: number;
    value: number;
    style?: React.CSSProperties;
}

function CustomTabPanel(props: CustomTabPanelProps) {
    const { children, value, index, ...other } = props;

    return (
        <div
            role="tabpanel"
            hidden={value !== index}
            id={`simple-tabpanel-${index}`}
            aria-labelledby={`simple-tab-${index}`}
            {...other}
        >
            {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
        </div>
    );
}

function a11yProps(index: number) {
    return {
        id: `simple-tab-${index}`,
        "aria-controls": `simple-tabpanel-${index}`,
    };
}

interface DashBoardProps {
    userType: string;
}

export default function DashBoard({ userType }: DashBoardProps) {
    const [value, setValue] = React.useState<number>(0);
    console.log(userType !== 'company');
    console.log(userType);

    const handleChange = (event: React.SyntheticEvent, newValue: number) => {
        setValue(newValue);
    };

    return (
        <Box
            sx={{
            width: "100%",
            bgcolor: "background.default",
            color: "text.primary",
            }}
        >
            {userType !== "company" ? (
                <>
                    <Box sx={{ borderBottom: 1, borderColor: "divider" }}>
                        <Tabs
                            value={value}
                            onChange={handleChange}
                            aria-label="trainer admin tabs"
                        >
                            <Tab label="Profile" {...a11yProps(0)} />
                            <Tab label="Ads Setup" {...a11yProps(1)} />
                            <Tab label="Payments" {...a11yProps(2)} />
                            <Tab label="Account" {...a11yProps(3)} />
                        </Tabs>
                    </Box>
                    <CustomTabPanel value={value} index={0} style={{ minHeight: "85vh" }}>
                        <Profile />
                    </CustomTabPanel>
                    <CustomTabPanel value={value} index={1} style={{ minHeight: "85vh" }}>
                        <BillingAdress />
                    </CustomTabPanel>
                    <CustomTabPanel value={value} index={2} style={{ minHeight: "85vh" }}>
                        <Payment />
                    </CustomTabPanel>
                    <CustomTabPanel value={value} index={3} style={{ minHeight: "85vh" }}>
                        <Account />
                    </CustomTabPanel>
                </>
            ) : (
                <>
                    <Box sx={{ borderBottom: 1, borderColor: "divider" }}>
                        <Tabs
                            value={value}
                            onChange={handleChange}
                            aria-label="company admin tabs"
                        >
                            <Tab label="Payments" {...a11yProps(0)} />
                            <Tab label="Account" {...a11yProps(1)} />
                        </Tabs>
                    </Box>
                    <CustomTabPanel value={value} index={0} style={{ minHeight: "85vh" }}>
                        <Payment />
                    </CustomTabPanel>
                    <CustomTabPanel value={value} index={1} style={{ minHeight: "85vh" }}>
                        <Account />
                    </CustomTabPanel>
                </>
            )}
        </Box>
    );
}
