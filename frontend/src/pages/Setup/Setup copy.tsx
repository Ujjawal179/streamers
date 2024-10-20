import React, { useState } from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import {
    IgrStepper, IgrStep, IgrStepperModule, IgrRadio, IgrRadioGroup, IgrRadioModule, IgrRadioGroupModule,
    IgrButton, IgrButtonModule, IgrSwitch, IgrSwitchModule, IgrCheckboxBase, IgrCheckboxChangeEventArgs, IgrComponentValueChangedEventArgs,IgrTextarea,
    IgrInput, IgrInputModule
} from "igniteui-react";
import { TextField } from '@mui/material';
import 'igniteui-webcomponents/themes/light/bootstrap.css';

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
        this.state = { linear: false, firstStepInvalid: true, secondStepInvalid: true, channelLinks: [] };
        this.OnSwitchChange = this.OnSwitchChange.bind(this);
        this.addChannelLink = this.addChannelLink.bind(this);
    }

    private renderChannelLinks() {
        return this.state.channelLinks.map((link: string, index: number) => (
            <IgrInput key={index} label={`Channel Link ${index + 1}`} type="text" value={link} />
        ));
    }

    private addChannelLink() {
        this.setState((prevState: any) => ({
            channelLinks: [...prevState.channelLinks, ""]
        }));
    }

    componentDidMount() {
        this.InfoForm.current.addEventListener("igcInput", this.onInput.bind(this));  
        this.AddressForm.current.addEventListener("igcInput", this.onInput.bind(this));        
    }

    public render(): JSX.Element {
        return (
            <div className="container sample">
                <IgrSwitch change={this.OnSwitchChange}><span key="liner-switch">Linear</span></IgrSwitch>

                <IgrStepper ref={this.stepperRef} linear={this.state.linear} >
                    <IgrStep key="info-step" invalid={this.state.linear && this.state.firstStepInvalid}>
                        <span key="info-title" slot="title">Personal Info</span>
                        <form ref={this.InfoForm}>
                            <IgrInput required label="Full name" type="text" name="full-name"></IgrInput>
                            <IgrInput label="Phone Number (with country code)" type="text" name="phone-num"></IgrInput>
                            <IgrTextarea required label="About" type="textarea" name="about"></IgrTextarea>
                            <IgrInput required label="Channel Link 1" type="text" name="mandatory-channel-link" />
                            {this.renderChannelLinks()}
                            {this.state.channelLinks.length < 3 && (
                                <IgrButton clicked={this.addChannelLink}><span key="add-channel-link">Add Channel Link</span></IgrButton>
                            )}
                            
                            <IgrButton disabled={this.state.linear && this.state.firstStepInvalid} clicked={this.onNextStep}><span key="info-next">NEXT</span></IgrButton>
                        </form>
                    </IgrStep>
                    <IgrStep key="ad-setup">
                        <span key="ad-title" slot="title">Ad Setup</span>
                        <form ref={this.AddressForm}>
                            <IgrInput required label="City" type="text" name="city"></IgrInput>
                            <IgrInput required label="Street" type="text" name="street"></IgrInput>
                            <IgrButton clicked={this.onPreviousStep}><span key="address-prev">PREVIOUS</span></IgrButton>
                            <IgrButton clicked={this.onNextStep}><span key="address-next">NEXT</span></IgrButton>
                        </form>
                    </IgrStep>
                    <IgrStep key="billing-step" >
                        <span key="billing-title" slot="title">Billing address</span>
                        <form>
                            <IgrInput  label="Company (optional)" type="text" name="bill-company"></IgrInput>
                            <IgrInput required label="Street" type="text" name="bill-street"></IgrInput>
                            <IgrInput required label="Street" type="text" name="bill-street"></IgrInput>
                            <IgrInput required label="City, State" type="text" name="bill-city"></IgrInput>
                            <IgrInput required label="ZIP" type="number" name="bill-ZIP"></IgrInput>
                            <IgrInput required label="Country" type="text" name="bill-country"></IgrInput>
                            <IgrButton clicked={this.onPreviousStep}><span key="billing-prev">PREVIOUS</span></IgrButton>
                            <IgrButton clicked={this.onNextStep}><span key="billing-next">NEXT</span></IgrButton>
                        </form>
                    </IgrStep>
                    <IgrStep key="payment-step">
                        <span key="payment-title" slot="title">Payment</span>
                        <IgrInput required label="IFSC Code" type="text" name="ifsc-code"></IgrInput>
                        <IgrInput required label="Account Number" type="number" name="acc-num"></IgrInput>
                        <IgrButton clicked={this.onPreviousStep}><span key="payment-prev">PREVIOUS</span></IgrButton>
                        <IgrButton clicked={this.onNextStep}><span key="payment-submit">SUBMIT</span></IgrButton>
                    </IgrStep>
                    <IgrStep key="onboarding"  invalid={this.state.linear && this.state.secondStepInvalid}>
                        <span key="onboarding-title" slot="title">OnBoarding!!</span>
                        <p key="status-content">Your order is on its way. Expect delivery on 25th September 2021. Delivery address: San Jose, CA 94243.</p>
                        <IgrButton clicked={this.onPreviousStep}><span key="status-prev">PREVIOUS</span></IgrButton>
                        <IgrButton clicked={this.onResetStepper}><span key="status-reset">HOME</span></IgrButton>
                    </IgrStep>
                </IgrStepper>
            </div>
        );
    }

    public OnSwitchChange(s: IgrCheckboxBase, e: IgrCheckboxChangeEventArgs) {
        this.setState({ linear: s.checked });
        if(s.checked){
           this.checkActiveStepValidity();
        }
    }

    public onInput(s: IgrInput, e: IgrComponentValueChangedEventArgs) {
        if(!this.state.linear) return;
        this.checkActiveStepValidity();       
    }

    private checkActiveStepValidity(){
        const activeStep = this.activeStep;
        if (activeStep && this.activeStepIndex === 0) {
            const isInvalidForm = this.checkFormValidity(this.InfoForm);
            this.setState({ firstStepInvalid: isInvalidForm });
        }
        if (activeStep && this.activeStepIndex === 1) {
            const isInvalidForm = this.checkFormValidity(this.AddressForm);
            this.setState({ secondStepInvalid: isInvalidForm });
        }
    }

    private checkFormValidity(form: any) {
        let isInvalidForm = false;
        for (const element of form.current.children) {
            if(element.tagName.toLowerCase() === 'igc-input' && element.value === ""){
                const oldInvalid = element.invalid;
                const isElementInvalid = !element.checkValidity();
                element.invalid = oldInvalid;
                if(isElementInvalid){
                    isInvalidForm = true;
                    break;
                }            
            }  
        }
        return isInvalidForm;
    }

    private onNextStep = () => {
        this.checkActiveStepValidity();
        const activeStep = this.activeStep;
        if (activeStep?.invalid) return; // Prevent proceeding if the step is invalid
        this.stepperRef.current?.next();
    }

    private onPreviousStep = () => {
        this.stepperRef.current?.prev();
    }

    private onResetStepper = () => {
        this.stepperRef.current?.reset();
    }

    private get activeStep(): IgrStep | undefined {
        return this.stepperRef.current?.steps.find((step: IgrStep, index: number) => {
            this.activeStepIndex = index;
            return step.active;
        });
    }
}

