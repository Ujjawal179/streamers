import React from 'react';
import {
    IgrStepper, IgrStep, IgrStepperModule, IgrRadioModule, IgrRadioGroupModule,
    IgrButton, IgrButtonModule, IgrSwitchModule, 
    IgrInput, IgrInputModule
} from "igniteui-react";
import 'igniteui-webcomponents/themes/light/bootstrap.css';
import CopyToClipboard from '../../components/CopytoClipboard/CopytoClipboard';
import { TextField } from '@mui/material';
import './index.css';
import { updateUser } from '../../api/userService';

IgrStepperModule.register();
IgrSwitchModule.register();
IgrInputModule.register();
IgrRadioModule.register();
IgrRadioGroupModule.register();
IgrButtonModule.register();

export default class Setup extends React.Component<any, any> {
    private stepperRef = React.createRef<IgrStepper>();
    private InfoForm = React.createRef<any>();
    private AddressForm = React.createRef<any>();
    private activeStepIndex = 0;

    constructor(props: any) {
        super(props);
        this.state = { linear: true, submitted: false, channelLinks: [], formData: {}, paymentLink: 'Pay Link', obsLink: 'OBS LINK', error: '' };
        this.addChannelLink = this.addChannelLink.bind(this);
        this.handleSubmit = this.handleSubmit.bind(this);
        this.handleInputChange = this.handleInputChange.bind(this); // Ensure this is bound
    }

    private renderChannelLinks() {
        return this.state.channelLinks.map((link: string, index: number) => (
            <IgrInput key={index} label={`Channel Link ${index + 2}`} type="text" value={link} />
        ));
    }

    private addChannelLink() {
        this.setState((prevState: any) => ({
            channelLinks: [...prevState.channelLinks, ""]
        }));
    }


    public render(): JSX.Element {
        if (window.innerWidth < 500) {
            return (
                <>
                <div className="container">
                    <h2 style={{textAlign:'center'}}>Please switch to a bigger screen for setup.</h2>
                </div>
                </>
            );
        }

        return (
            <div className="container">
                <IgrStepper ref={this.stepperRef} linear={this.state.linear}>
                    <IgrStep key="info-step" >
                        <span key="info-title" slot="title">Personal Info</span>
                        <form ref={this.InfoForm}>
                            <IgrInput required label="Channel Link" type="text" name="channelLink" value={this.state.formData.channelLink || ''} onInput={this.handleInputChange} />
                            <IgrButton clicked={this.onNextStep}><span key="info-next">NEXT</span></IgrButton>
                        </form>
                    </IgrStep>
                    <IgrStep key="ad-setup">
                        <span key="ad-title" slot="title">Ad Setup</span>
                        <form ref={this.AddressForm}>
                            <IgrInput required label="Cost per Second (in Rupees)" type="number" name="charge" value={this.state.formData.costpersecond || ''} onInput={this.handleInputChange}></IgrInput>
                            <IgrInput required label="Time Gap between consecutive Ads (in minutes)" type="number" name="timeout" value={this.state.formData.timeGap || ''} onInput={this.handleInputChange}></IgrInput>
                            <IgrButton clicked={this.onPreviousStep}><span key="address-prev">PREVIOUS</span></IgrButton>
                            <IgrButton clicked={this.onNextStep}><span key="address-next">NEXT</span></IgrButton>
                        </form>
                    </IgrStep>
                    <IgrStep key="payment-step">
                        <span key="payment-title" slot="title">Payment</span>
                        <form>
                        <IgrInput required label="IFSC Code" type="text" name="ifsc" value={this.state.formData.ifsc || ''} onInput={this.handleInputChange}></IgrInput>
                        <IgrInput required label="Account Number" type="number" name="accountNumber" value={this.state.formData.accountNumber || ''} onInput={this.handleInputChange}></IgrInput>
                        {this.state.error && <p style={{ color: 'red' }}>{this.state.error}</p>}
                        <IgrButton clicked={this.onPreviousStep}><span key="payment-prev">PREVIOUS</span></IgrButton>
                        <IgrButton clicked={this.handleSubmit}><span key="payment-submit">SUBMIT</span></IgrButton>
                        </form>
                    </IgrStep>
                    <IgrStep key="onboarding" disabled={this.state.linear && !this.state.submitted}>
                        <span key="onboarding-title" slot="title">OnBoarding!!</span>
                        <h2>Congratulation on completing setup!!</h2>
                        <p key="status-content">Now you are eligible for adding streamers to your OBS studio and start monetizing your streams.</p>
                        <div className="links">
                        <div className="obs-link-box"  style={{ width: "100%", display: 'flex', alignItems: 'center' }}>
                            <TextField value={this.state.obsLink} InputProps={{ readOnly: true }} style={{ width: "50%", minWidth:'350px',}} />
                            <CopyToClipboard text={this.state.obsLink} />
                        </div>
                        <div className="payment-link-box" style={{ width: "100%", display: 'flex', alignItems: 'center' }}>
                            <TextField value={this.state.paymentLink} InputProps={{ readOnly: true }} style={{ width: "50%", minWidth: '350px' }} />
                            <CopyToClipboard text={this.state.paymentLink}  />
                        </div>
                        </div>
                    </IgrStep>
                </IgrStepper>
            </div>
        );
    }

    private handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = event.target;
        this.setState((prevState: any) => ({
            formData: {
                ...prevState.formData,
                [name]: value,
            },
        }));
    }
    

    private async handleSubmit() {
        try {
            const missingFields = ['ifsc', 'accountNumber', 'charge', 'timeout', 'channelLink']
                .filter(field => !this.state.formData[field]);

            if (missingFields.length > 0) {
                console.log(missingFields);
                this.setState({ error: 'Please fill in all required fields' });
                return;
            }
            const updatedFormData = {
                ...this.state.formData,
                charge: parseInt(this.state.formData.charge, 10),
                timeout: parseInt(this.state.formData.timeout, 10),
            };
            await this.setState({ formData: updatedFormData });

            const response = await updateUser(this.state.formData);

            if (response.status === 200) {
                const id = localStorage.getItem('user') ? JSON.parse(localStorage.getItem('user') || '{}').id : '';
                this.setState({
                    submitted: true,
                    error: 'Details submitted successfully!',
                    obsLink: `Streamers.media/${id}`,
                    paymentLink: `Streamers.media/upload/${id}`,
                }, this.onNextStep);
            } else {
                this.setState({ error: 'Failed to submit form' });
            }

        } catch (error) {
            console.error('Error during form submission:', error);
            this.setState({ error: 'Error during form submission' });
        }
    };
    
    // private async submitForm(updatedForm: any) {
    //     try {
    //         const apiUrl = 'https://your-api-endpoint.com/submit'; // Replace with your API endpoint
    //         const response = await fetch(apiUrl, {
    //             method: 'POST',
    //             headers: {
    //                 'Content-Type': 'application/json',
    //             },
    //             body: JSON.stringify(updatedForm),
    //         });
    
    //         if (response.ok) {
    //             console.log('Form submitted successfully');
    //             this.setState({ submitted: true }, this.onNextStep);
    //         } else {
    //             console.log('Failed to submit form');
    //         }
    //     } catch (error) {
    //         console.error('Error during form submission:', error);
    //     }
    // }
    

    private onNextStep = () => {
        const activeStep = this.activeStep;
        if (activeStep?.invalid) return;
        this.stepperRef.current?.next();
    }

    private onPreviousStep = () => {
        this.stepperRef.current?.prev();
    }

    private onResetStepper = () => {
        this.stepperRef.current?.reset();
    }

    private get activeStep() {
        return this.stepperRef.current?.steps[this.activeStepIndex];
    }
}