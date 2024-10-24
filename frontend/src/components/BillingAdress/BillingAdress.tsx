import React, { useState } from "react";
import { TextField, InputLabel, FormControl, NativeSelect, Box, Button } from "@mui/material";
import styles from "./Profile.module.css";

const BillingAdress: React.FC = () => {
  const [Name, setName] = useState<string>("");
  const [phoneNumber, setPhoneNumber] = useState<number | string>();
  const [about, setAbout] = useState< string>("");
  const [channelLinks, setChannelLinks] = useState<string[]>([]);

  const addChannelLink = () => {
    setChannelLinks([...channelLinks, ""]);
  };

  const handleChannelLinkChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>, index: number) => {
      const newChannelLinks = [...channelLinks];
      newChannelLinks[index] = e.target.value;
      setChannelLinks(newChannelLinks);
    };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const profileData = {
      Name,
      phoneNumber,
      about,
      channelLinks,
    };
    console.log(profileData);
    // You can add further logic to handle the form submission, such as sending the data to a server
  };

  return (
    <div>
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {/* <TextField variant="standard" required label="Cost per Second" type="number" name="cost-per-second" value={Name} onChange={(e) => setName(e.target.value)} /> */}
      {/* <TextField variant="standard" label="Time Gap between 2 Ads" type="number" name="time" value={phoneNumber} onChange={(e) => setPhoneNumber(e.target.value)} /> */}
      <Button type="submit">Submit</Button>
    </form>
    </div>
  );
};

export default BillingAdress;
