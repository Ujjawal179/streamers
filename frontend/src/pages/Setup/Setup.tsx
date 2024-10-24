import React from 'react';
import {
    IgrStepper, IgrStep, IgrStepperModule, IgrRadioModule, IgrRadioGroupModule,
    IgrButton, IgrButtonModule, IgrSwitchModule, IgrTextarea,
    IgrInput, IgrInputModule
} from "igniteui-react";
import 'igniteui-webcomponents/themes/light/bootstrap.css';
import CopyToClipboard from '../../components/CopytoClipboard/CopytoClipboard';
import { TextField } from '@mui/material';
import './index.css';

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
        this.state = { linear: true, submitted: false, channelLinks: [], formData: {}, paymentLink: 'Pay Link', obsLink: 'OBS LINK' };
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
        return (
            <div className="container">
                <IgrStepper ref={this.stepperRef} linear={this.state.linear}>
                    <IgrStep key="info-step" >
                        <span key="info-title" slot="title">Personal Info</span>
                        <form ref={this.InfoForm}>
                            {/* <IgrInput label="Phone Number (with country code)" type="text" name="name" value={this.state.formData.phoneNum || ''} onInput={this.handleInputChange}></IgrInput> */}
                            {/* <IgrTextarea required label="About" type="textarea" name="about" value={this.state.formData.about || ''} onInput={this.handleInputChange}></IgrTextarea> */}
                            <IgrInput required label="Channel Link" type="text" name="channelLink" value={this.state.formData.mandatoryChannelLink || ''} onInput={this.handleInputChange} />
                            {/* {this.renderChannelLinks()}
                            {this.state.channelLinks.length < 2 && (
                                <IgrButton clicked={this.addChannelLink}><span key="add-channel-link">Add Channel Link</span></IgrButton>
                            )} */}
                            <IgrButton clicked={this.onNextStep}><span key="info-next">NEXT</span></IgrButton>
                        </form>
                    </IgrStep>
                    <IgrStep key="ad-setup">
                        <span key="ad-title" slot="title">Ad Setup</span>
                        <form ref={this.AddressForm}>
                            <IgrInput required label="Cost per Second" type="number" name="" value={this.state.formData.city || ''} onInput={this.handleInputChange}></IgrInput>
                            <IgrInput required label="Time Gap between 2 Ads" type="number" name="" value={this.state.formData.city || ''} onInput={this.handleInputChange}></IgrInput>
                            {/* <IgrInput required label="Street" type="text" name="street" value={this.state.formData.street || ''} onInput={this.handleInputChange}></IgrInput> */}
                            <IgrButton clicked={this.onPreviousStep}><span key="address-prev">PREVIOUS</span></IgrButton>
                            <IgrButton clicked={this.onNextStep}><span key="address-next">NEXT</span></IgrButton>
                        </form>
                    </IgrStep>
                    <IgrStep key="payment-step">
                        <span key="payment-title" slot="title">Payment</span>
                        <form>
                        <IgrInput required label="IFSC Code" type="text" name="ifsc" value={this.state.formData.ifscCode || ''} onInput={this.handleInputChange}></IgrInput>
                        <IgrInput required label="Account Number" type="number" name="accountNumber" value={this.state.formData.accNum || ''} onInput={this.handleInputChange}></IgrInput>
                        <IgrButton clicked={this.onPreviousStep}><span key="payment-prev">PREVIOUS</span></IgrButton>
                        <IgrButton clicked={this.handleSubmit}><span key="payment-submit">SUBMIT</span></IgrButton>
                        </form>
                    </IgrStep>
                    <IgrStep key="onboarding" disabled={this.state.linear && !this.state.submitted}>
                        <span key="onboarding-title" slot="title">OnBoarding!!</span>
                        <h2>Congratulation on completing setup!!</h2>
                        <p key="status-content">Now you are eligible for adding streamers to your OBS studio and start monetizing your streams.</p>
                        <div className="links">
                        <div className="obs-link-box"  style={{ display: 'flex', alignItems: 'center' }}>
                            <TextField value={this.state.obsLink} InputProps={{ readOnly: true }} style={{minWidth:'350px',}} />
                            <CopyToClipboard text={this.state.obsLink} style={{ marginLeft:'-85px'}}/>
                        </div>
                        <div className="payment-link-box" style={{ display: 'flex', alignItems: 'center' }}>
                            <TextField value={this.state.paymentLink} InputProps={{ readOnly: true }} style={{ minWidth: '350px' }} />
                            <CopyToClipboard text={this.state.paymentLink} style={{marginLeft: '-85px' }} />
                        </div>
                        </div>
                        <IgrButton clicked={this.onPreviousStep}><span key="status-prev">PREVIOUS</span></IgrButton>
                        <IgrButton clicked={this.onResetStepper}><span key="status-reset">HOME</span></IgrButton>
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
        const apiUrl = 'https://your-api-endpoint.com/submit'; // Replace with your API endpoint
        this.setState({ 
            obsLink: 'https://obs-linfveeeeeeek.com', 
            paymentLink: 'https://Payfveeeeeeement-link.com' 
        }, () => {
            console.log('Form Data:', JSON.stringify(this.state.formData)); // Log after state update
            // Proceed with the API request
            this.submitForm(apiUrl);
        });
    }
    
    private async submitForm(apiUrl: string) {
        try {
            const response = await fetch(apiUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(this.state.formData),
            });
    
            if (response.ok) {
                console.log('Form submitted successfully');
                this.setState({ submitted: true }, this.onNextStep);
            } else {
                console.log('Failed to submit form');
            }
        } catch (error) {
            console.error('Error during form submission:', error);
        }
    }
    

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