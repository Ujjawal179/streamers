import React, { useState } from "react";
import { TextField, InputLabel, FormControl, NativeSelect, Box, Button } from "@mui/material";
import styles from "./Profile.module.css";
import { logoutUser } from "../../api/userService";

const Account: React.FC = () => {

  return (
    <div>
      <Button onClick={logoutUser}>Log Out</Button>
      <Button >Delete Account</Button>
    </div>
  );
};

export default Account;
