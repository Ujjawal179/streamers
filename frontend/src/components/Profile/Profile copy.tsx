import React, { useState } from "react";
import { TextField, InputLabel, FormControl, NativeSelect, Box, Button } from "@mui/material";
import styles from "./Profile.module.css";

const Profile: React.FC = () => {
  const [Name, setName] = useState<string>("Ujjawal");
  const [Email, setEmail] = useState<string>("Ujjawal@gmail.com");
  const [file, setFile] = useState<File | null>(null);
  const [PhoneNumber, setPhoneNumber] = useState<number | string>(276874248);
  const [Weight, setWeight] = useState<number | string>(30);
  const [Height, setHeight] = useState<number | string>(330);
  const [Gender, setGender] = useState<number>(0);
  const [isHovered, setIsHovered] = useState<boolean>(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const uploadedFile = e.target.files?.[0];
      if (uploadedFile) {
        setFile(uploadedFile);
      }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) {
      setFile(droppedFile);
    }
    setIsHovered(false);
  };  


    const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
  };

  const handleDragEnter = () => {
    setIsHovered(true);
  };

  const handleDragLeave = () => {
    setIsHovered(false);
  };

  return (
    <div>
      <h1 className="highlighted head text-center">Edit Profile</h1>
      <div className={styles.profile}>
        <div className="d-flex flex-column mw-40 justify-content-center align-items-center">
        <Box
                        sx={{ my: { xs: 2, sm: 3, md: 4, lg: 5 },
                            margin: "auto",
                            textAlign: "center",
                            width: "60%",
                            border: "2px dashed #ccc",
                            borderRadius: "20px",
                            height: "250px",
                            minWidth: "300px",
                            display: "flex",
                            flexDirection: "column",
                            justifyContent: "center",
                            alignItems: "center",
                            mb: 2,
                            backgroundColor: isHovered ? "grey" : "#fff",
                            color: isHovered ? "#fff" : "#000",
                            transition: "background-color 0.3s ease",
                        }}
                        onDrop={handleDrop}
                        onDragOver={handleDragOver}
                        onDragEnter={handleDragEnter}
                        onDragLeave={handleDragLeave}
                    >
                        {file ? (
                            <div style={{ marginTop: "10px", position: 'absolute',  textAlign: 'center' }}>
                              {isHovered ? 
                              <p>"Drop it like it's hot!" </p>
                              :
                              <img src={URL.createObjectURL(file)} alt="Uploaded file" style={{ maxWidth:'300px', maxHeight:'300px'}} />
                              }
                              </div>
                        ) : (
                            <div style={{
                                display: "flex",
                                flexDirection: "column",
                                justifyContent: "center",
                                alignItems: "center",
                                position: "absolute",
                            }}>
                                {isHovered ? null : <img src="/dropfile.png" alt="Drop file here" style={{ height: '150px', paddingTop: '15px' }} />}
                                <p>{isHovered ? "Drop it like it's hot!" : "Drag and drop a file here or click to upload"}</p>
                            </div>
                        )}
                        <input  type="file" accept="image/*"  onChange={handleFileChange} style={{ width: '100%', minHeight: "250px", minWidth: "300px", opacity: '0' }} />
                    </Box>
        </div>
        <div className={styles.profileDetails}>
          <TextField
            className={styles.name}
            id="filled-basic"
            label={"Name"}
            variant="standard"
            onChange={(e) => setName(e.target.value)}
            value={Name}
            style={{ marginTop: "20px" }}
          />
          <TextField
            className={styles.phoneNumber}
            id="filled-basic"
            label={"Phone Number"}
            variant="standard"
            onChange={(e) => setPhoneNumber(e.target.value)}
            value={PhoneNumber}
            style={{ marginTop: "20px" }}
          />
          <TextField
            className={styles.email}
            id="filled-basic"
            label={"Email"}
            variant="standard"
            onChange={(e) => setEmail(e.target.value)}
            value={Email}
            style={{ marginTop: "20px" }}
          />
          <div>
            <TextField
              className={styles.weight}
              id="filled-basic"
              label={"Weight"}
              variant="standard"
              onChange={(e) => setWeight(e.target.value)}
              value={Weight}
              style={{ marginTop: "20px", marginRight: "20px" }}
            />
            <TextField
              className={styles.height}
              // col="7"
              id="filled-basic"
              label={"Height"}
              variant="standard"
              onChange={(e) => setHeight(e.target.value)}
              value={Height}
              style={{ marginTop: "20px" }}
            />
          </div>
          <FormControl
            fullWidth
            style={{ maxWidth: "100px", marginTop: "20px" }}
          >
            <InputLabel variant="standard" htmlFor="uncontrolled-native">
              Gender
            </InputLabel>
            <NativeSelect
              defaultValue={Gender}
              inputProps={{
                name: "gender",
                id: "uncontrolled-native",
              }}
              onChange={(e) => setGender(Number(e.target.value))}
              value={Gender}
            >
              <option value={1}>Male</option>
              <option value={0}>Female</option>
            </NativeSelect>
          </FormControl>
          <Button variant="contained" color="primary" type="submit" style={{ marginTop: '20px' }} >
            Submit
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Profile;
