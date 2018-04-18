/**
 * Developer: Felipe Andrew Lacaya
 * Email: drewacs@gmail.com
 * Project Name: SMS Proxy for Trucking Company
 * Description: Proxy between the Trucking company server and clients (Driver
 *              and customer). Driver sends request to server for schedules
 *              while customer sends request for deliveries to the server via
 *              this application while it turns sends this to SQL server for
 *              processing. SQL server will send response via this app, and will
 *              send the response to the Driver or customer for the response.
 */

import React, { Component } from 'react';
import {
  Platform,
  StyleSheet,
  Text,
  View,
  TextInput,
  Alert,
  TouchableOpacity,
  ScrollView,
  Picker,
  Modal,
  ActivityIndicator,
  Dimensions,
} from 'react-native';

import {
  //Button,
  Header,
  //Overlay,
} from 'react-native-elements';

//import React, { View, Text } from 'react-native';

//import Spinner from 'react-native-loading-spinner-overlay';


import SmsAndroid  from 'react-native-get-sms-android';
import Icon from 'react-native-vector-icons/FontAwesome';
import DeviceInfo from 'react-native-device-info';


/* List SMS messages matching the filter */
//var filter = {
    //box: 'inbox', // 'inbox' (default), 'sent', 'draft', 'outbox', 'failed', 'queued', and '' for all
    // the next 4 filters should NOT be used together, they are OR-ed so pick one
    //read: 0, // 0 for unread SMS, 1 for SMS already read
    //_id: 1234, // specify the msg id
    //address: '+1888------', // sender's phone number
    //body: 'How are you', // content to match
    // the next 2 filters can be used for pagination
    //indexFrom: 0, // start from index 0
    //maxCount: 10, // count of SMS to return each time
    //box: 'inbox',
    //maxCount: 10,

//};

var sms_data = null;
var sms_count;



type Props = {};
export default class App extends Component<Props> {

  constructor(props) {
      super(props)
      this.state = {
        //visible: false,
        // For Outgoing SMS states
        Message: "",
        SendTo: "",
        LastSendState: "",
        Loc: "",
        LastDeleteSMSState: "",

        MessageEncoded: "",

        // For Incoming SMS states
        ToInbound: "",
        MessageInbound: "",
        MessageInboundIncoded: "",
        MessageSendURI: "",
        MessageInboundId: "",
        MessageInboundStatus: "", //SAVED or blank


        // For permanent deletion data
        DeleteArdIn: "",
        LastDeleteStatus: "",

        visibleWait: false,
        visibleAutoFetch: false,
        autoFetchMessage: "Running Auto Fetch...",
        FetchMessage: "",
        FetchStatus: "STOP",

        SMS_Received: "",

        Timer: "3",
        smsList: [],

        textColor: "#000",
        subTextColor: "#000",
        testWait: "Please wait ...",
        subTextWait: "",


        lastOutboundMsgLoc: "",
        lastOutboundMsgTry: 0,



        //Admin States:

        adminSendError: true,
        adminSMSNumber: "5108670000",
        adminTexted: false,

        smsRetry: 5,
        serverRetry: 10,




      }

      this.screenWidth = Dimensions.get('window').width,
      this.screenHeight = Dimensions.get('window').height,

      this.retry = 5,
      this.ardErrorCode = "^",
      this.serverAccessErrorTry = 0,
      this.serverAccessThreasholdGetHelp = 10,

      this.listSMS();

      this.phoneNumber = DeviceInfo.getPhoneNumber();
  }

  componentDidMount() {
    //setInterval(() => {
    //  this.setState({
    //    visible: !this.state.visible
    //  });
    //}, 3000);
    //DeviceEventEmitter.addListener('sms_onDelivery', (msg) => {
    //  this.setState({eventSMSReceived:msg});
    //});
  }


  async wait(ms, message) {
    this.setState({visibleWait: true, subTextWait: message});
    await new Promise((resolve) => setTimeout(() => resolve(), ms));
    this.setState({visibleWait: false, subTextWait: message});
  }

  listSMS() {
    var filter = {
      box: 'inbox',
      //maxCount: 10,
      read: 0,
    };

    SmsAndroid.list(JSON.stringify(filter), (fail) => {
      //console.log("Failed with this error: " + fail)
    }, (count, smsList) => {
      var arr = JSON.parse(smsList);
      //console.log(arr);
      this.setState({ smsList: arr });
    });

    //this.writeFetchMessage("Getting SMS List")
  }

  async sendSMS() {
    result = 0;

    await SmsAndroid.autoSend(this.state.SendTo, this.state.Message, (err) => {
      //Alert.alert("Failed to send SMS. Check console");
      //console.log("SMS SEND ERROR", err);
      result = err;
      this.setState({LastSendState:err});
    }, (success) => {
      //Alert.alert("SMS sent successfully");
      //this.wait(2000);
      result = 1;
      this.setState({LastSendState:"Success"});
    });

    //await this.wait(1000);
    return result;
  }


  async sendSMStoAdmin(message) {
    result = 0;

    if( this.state.adminSendError && this.state.adminSMSNumber != "" ) {
      this.writeFetchMessage("Sending to admin...");
      await SmsAndroid.autoSend(this.state.adminSMSNumber, message, (err) => {
        result = err;
      }, (success) => {
        result = 1;

      });
    }
    return result;
  }


  async deleteSMS(id) {

    await SmsAndroid.delete(id, (err) => {
      //Alert.alert("Failed to deleted SMS. Check console");
      //console.log("SMS DELETE ERROR", err);
      this.setState({LastDeleteSMSState:err});
    }, (success) => {
      //Alert.alert("SMS deleted successfully");
      //await this.listSMS();
      this.setState({LastDeleteSMSState: "Success"});
    });
  }


  async pullSVCAMessage() {

    result = 0;

    await fetch('http://www.svcausa.com/smsgprs/smsread.php')
    .then((resp)=>{ return resp.text() })
    .then((text)=>{
      //console.log(text)
      res_result = text.substring(text.lastIndexOf("#RESULT:")+9, text.lastIndexOf(" ~<br>#END"));

      //if( res_result == 'NOMSG' ) {
      if( text.search('NOMSG') != -1 ) {
        result =  0;
      }
      else if ( text.search('LOCATION') != -1 ){
        location = text.substring(text.lastIndexOf("#LOCATION:")+10, text.lastIndexOf(" ~<br>#TO"));
        to = text.substring(text.lastIndexOf("#TO:")+5, text.lastIndexOf(" ~<br>#MSG"));

        msg = text.substring(text.lastIndexOf("#MSG:")+6, text.lastIndexOf(" ~<br>#END"));
        //replace character [`] as enter or carriege return \n
        msg = msg.replace(/\`/g, '\n');
        msg_encoded = encodeURIComponent(msg);
        this.setState({
          SendTo: to,
          Message: msg,
          MessageEncoded: msg_encoded,
          Loc: location
        })

        result = 1;
      }
      else {
        result = -1;
      }


    }).catch((error) => {
      //Alert.alert('Error',error);
      result = error;
    });

    return result;

  }


  onPress_GetNextOutboundMessage = () => {
    this.setState({
      SendTo: "",
      Message: "",
      MessageEncoded: "",
      Loc: "",
    });

    (async () => {
      result = await this.pullSVCAMessage();
      //await this.wait(3000, "Retrieving outbound message.");


      if( result == 0 ) {
        Alert.alert("No outbound messages from the server.");
      }
      else if ( result == -1 ){
        Alert.alert("Unable to access server!");
      }
      else if ( result != 1 ) {
          Alert.alert("Error", result);
      }

    })();

  }

  clearOutboundState() {
    this.setState(
      {
        SendTo: "",
        Message: "",
        MessageEncoded: "",
      }
    );
  }

  onPress_sendSMS = () => {
    if( this.state.Message ) {
      this.setState({LastSendState:""});
      //Todo: Send Message to SMS
      (async () => {
        to = this.state.SendTo;
        loc = this.state.Loc;
        result = await this.sendSMS();
        await this.wait(5000, "Sending SMS message to\n"+to);
      //Alert.alert("Message Sent to " + this.state.SendTo this.state.Message);
        if( this.state.LastSendState == "" ) {
          //try to wait 3 times x 5000
          waiting_response = 0;
          while( this.state.LastSendState == "" && waiting_response < 3 ) {
            await this.wait(5000, "Sending SMS message to\n"+to);
            waiting_response = waiting_response + 1;
          }

          if( this.state.LastSendState == "" ) {
            this.setState({LastSendState:"SMSSENDNOTSURE"});
          }
        }
        Alert.alert("Message Sent to " + to, "Result: ["+this.state.LastSendState+"]");

        if( this.state.LastSendState == "Success" ) {
          await this.deleteMessage(loc, false, null);
        }
      })();
      this.setState({LastSendState:""});
    }
    else {
      Alert.alert("Unable to send SMS!", "No Message provided.")
    }

    this.clearOutboundState();
    this.setState({ Loc: "", LastSendState: "" });
  }

  onPress_markSentSMS = () => {

    if( this.state.Loc ) {
      //Todo: Send Message to SMS
      //Alert.alert("Mark message as Sent ", "Location: " + this.state.Loc);
      location = this.state.Loc;

      (async () => {
        await this.deleteMessage(location, false, null);
        await this.wait(3000, "Marking message as SENT.");

        Alert.alert("Marking message as Sent.", "Result : ["+this.state.LastDeleteStatus+"]" );
        if( this.sate.LastDeleteStatus == "Success" ) {
          this.setState({ Loc: "" });
          this.clearOutboundState();
        }

      })();

    }
    else {
      Alert.alert("Unable to mark message sent!", "No Message Location provided.")
    }


  }


  clearInboundState() {
    this.setState(
      {
        ToInbound: "",
        MessageInbound: "",
        MessageInboundIncoded: "",
        MessageSendURI: "",
        MessageInboundId: ""
      }
    );
  }


  //fixedEncodeURIComponent (str) {
  //  return encodeURIComponent(str).replace(/[!'()*]/g, escape);
  //}



  async getNextSMS () {
    var found = false;

    if( this.state.smsList.length > 0 ) {

      var i;

      for (i=0; i< this.state.smsList.length; i++ ) {
          object = this.state.smsList[i];

          if(object.read == 0) {
            //msg = this.fixedEncodeURIComponent(object.body);
            msg = encodeURIComponent(object.body);
            //msg = msg.replace(/\'/g, '%27');
            //Replace carriege return (enter) to character [`]
            msg = msg.replace(/%0A/g, "`");
            uri = "http://www.svcausa.com/smsgprs/smssend.php?acp="+this.phoneNumber+"&from="+object.address+"&msg="+msg;
            this.setState(
              {
                ToInbound: object.address,
                MessageInbound: object.body,
                MessageInboundId: object._id,
                MessageInboundIncoded: msg,
                MessageSendURI: uri,
                MessageInboundStatus: "",
              }
            );
            //Delete instead of just marking Read in final version.
            object.read = 1;
            found = true;
            break;
          }

      }

      if ( found == false) {
          await this.listSMS();
          this.clearInboundState();
      }

    }
    else {
      await this.listSMS();
    }

    return found;

  }


  onPress_GetNextSMSInboundMessages = () => {

    (async () => {
      found = await this.getNextSMS();

      if (found ) {
        //enable delete message
      }
      else {
        Alert.alert("No unread SMS message found!");
      }

    })();

  }


  async saveSMSToSVCA() {
    //if( this.state.MessageSendURI ) {
      await fetch(this.state.MessageSendURI)
      .then((resp)=>{
        //Alert.alert('Send Status', resp.ok)
        return resp.text()
      })
      .then((text)=>{
        result = text.substring(text.lastIndexOf("#RESULT:")+9, text.lastIndexOf(" ~<br>#LOCATION"));
        trno = text.substring(text.lastIndexOf("#LOCATION:")+11, text.lastIndexOf(" ~<br>"));

        if( result == 'OK') {
          //Alert.alert("Send to SVCA Success!", "TR No: " + trno );
          this.setState({ MessageInboundStatus: "Success"});
        }
        else {
          //Alert.alert("Failed to send SMS to SVCA!")
          this.setState({ MessageInboundStatus: result });
        }
        //Alert.alert('Send Status', text);
      })
      .catch((error) => {
        //Alert.alert('Send to SVCA Failed',error);
        this.setState({ MessageInboundStatus: error });
      });
    //} else
    //{
    //  Alert.alert("Failed to send SMS to SVCA!", "No SMS message to send.")
    //}

  }


  onPress_SendToSvca = () => {
    if( this.state.MessageSendURI ) {

      (async () => {
        this.saveSMSToSVCA();

        await this.wait(4000, "Sending SMS Message to SVCA.");
        Alert.alert("SMS Message sent to SVCA", "Result: ["+this.state.MessageInboundStatus+"]");

        if( this.state.MessageInboundStatus == "Success" ) {
          //To Do: Delete or mark read the SMS. MessageInboundId
          this.deleteSMS(this.state.MessageInboundId);
          this.clearInboundState();
        }
        else {
          //Retry
        }
      })();

    }
    else{
      Alert.alert("Failed to send SMS to SVCA!", "No SMS message to send.")
    }
  }



  async deleteMessage(location,permanent,param) {

    let permanent_code = "";
    let mark = "SENT";

    if(permanent) {
      permanent_code = "*";
      mark = "DELETE";
    }

    if ( !permanent && param != null ) {
      permanent_code = param;
    }

    uri = "http://www.svcausa.com/smsgprs/smsdelete.php?loc="+location+permanent_code;

    try {
      let response = await fetch(uri);

      if( response.status > 400 ) {
        //Alert.alert('Error communicating server!', response.status);
        this.setState({LastDeleteStatus: "Communication error!"});
      } else {
        text = await response.text();

        result = await text.substring(text.lastIndexOf("#RESULT:")+9, text.lastIndexOf(" ~"));


        if( result == 'OK') {
          //await Alert.alert("Mark "+mark+" message, Location: "+location, "Success");
          this.setState({LastDeleteStatus: "Success"});
        }
        else {
          //Alert.alert("Failed to mark "+mark+" message, Location: "+location, result)
          this.setState({LastDeleteStatus: result});
        }


      }

    } catch(e) {
      //Alert.alert('Error communicating with server!', e);
      this.setState({LastDeleteStatus: e})
    }


  }

  onPress_DeleteMessageFromSVCA = () => {
    if( this.state.DeleteArdIn ) {

      (async () => {
        await this.deleteMessage(this.state.DeleteArdIn, true, null);
        await this.wait(3000, "Deleting message from SVCA");

        Alert.alert("Deleting message from SVCA", "Result : ["+this.state.LastDeleteStatus+"]" );
        if( this.state.LastDeleteStatus == "Success" ) {
          this.setState({ DeleteArdIn: "", LastDeleteStatus: "" });
        }
      })();

    }
    else {
      Alert.alert("Unable to delete message from SVCA!", "No Location number provided.")
    }
  }

  async sleep( interval ) {
    timer = interval * 1000;
    await new Promise((resolve) => setTimeout(() => resolve(), timer));
  }

  writeFetchMessage(message) {
    newMessage = this.state.FetchMessage.concat("\n"+message);
    this.setState({FetchMessage:newMessage});
  }

  onPress_AutoFetch = () => {

    (async () => {
      this.setState({autoFetchMessage: "Running Auto Fetch..."});
      this.setState({visibleAutoFetch: true});


      this.setState({FetchMessage:"Starting auto fetch ... "});

      await new Promise((resolve) => setTimeout(() => resolve(), 2000));

      let count = 1;
      this.setState({lastOutboundMsgTry: 0});
      this.setState({lastOutboundMsgLoc: ""});

      this.setState({FetchStatus:"RUNNING"});
      this.writeFetchMessage("Fetching every "+this.state.Timer+" seconds...");
      this.writeFetchMessage("Ready!");
      while(this.state.FetchStatus == "RUNNING") {
        //this.writeFetchMessage("Running fetch count : " + count);

         // Get Next OUTBOUND Message from SVCA server
        result = await this.pullSVCAMessage();

        if( result == 0 ) {
          //this.writeFetchMessage("No outbound messages from the server.");
        }
        else if ( result == -1 ){
          this.writeFetchMessage("Unable to access server!");
          this.serverAccessErrorTry = this.serverAccessErrorTry + 1;
        }
        else if ( result != 1 ) {
          this.writeFetchMessage("Error accessing SVCA: " + result);
          this.serverAccessErrorTry = this.serverAccessErrorTry + 1;
        }
        else {
          date = new Date();
          this.writeFetchMessage(date);
          this.writeFetchMessage("Outbound message to "+this.state.SendTo+" found!");




          this.setState({LastSendState:""});

          to = this.state.SendTo;
          loc = this.state.Loc;


          //if outbound Loc value is the same as lastOutboundMsgLoc
          if( this.state.Loc == this.state.lastOutboundMsgLoc ) {
              retry = this.state.lastOutboundMsgTry + 1;
              this.setState({lastOutboundMsgTry: retry});
              this.writeFetchMessage("Retry #"+this.state.lastOutboundMsgTry+" ...");
          }


          result = await this.sendSMS();
          await new Promise((resolve) => setTimeout(() => resolve(), 5000));
          if( this.state.LastSendState == "" ) {
            //try to wait 3 times x 5000
            waiting_response = 0;
            while( this.state.LastSendState == "" && waiting_response < 3 ) {
              //await this.wait(5000, "Sending SMS message to\n"+to);
              await new Promise((resolve) => setTimeout(() => resolve(), 5000));
              waiting_response = waiting_response + 1;
            }

            if( this.state.LastSendState == "" ) {
              this.setState({LastSendState:"SMSSENDNOTSURE"});
            }
          }
          this.writeFetchMessage("Message Sent to "+ to +" ..." + this.state.LastSendState );

          if( this.state.LastSendState == "Success" ) {
            await this.deleteMessage(loc, false, null);
            this.setState({lastOutboundMsgLoc: "", lastOutboundMsgTry: 0});
          }
          else {


            //Number of retry reached, marked not sent and reset retry.
            if ( this.state.lastOutboundMsgTry == this.state.smsRetry ) {
              this.writeFetchMessage("Number of retry reached!");
              //To Do: Make this marking as failure instead of ARD_SENT.
              await this.deleteMessage(loc, false, this.ardErrorCode);
              this.setState({lastOutboundMsgLoc: "", lastOutboundMsgTry: 0})
            }
            else {
              this.setState({lastOutboundMsgLoc: this.state.Loc});
            }

          }




          this.clearOutboundState();
          this.setState({ Loc: "", LastSendState: "" });

          this.serverAccessErrorTry = 0;
        }




        // End of Get Next OUTBOUND Message from SVCA server

        // Get Next SMS Message

        found = await this.getNextSMS();

        if (found ) {
          date = new Date();
          this.writeFetchMessage(date);
          this.writeFetchMessage("Found new SMS from "+this.state.ToInbound+".");


          this.saveSMSToSVCA();
          await new Promise((resolve) => setTimeout(() => resolve(), 4000));
          //await this.wait(4000, "Sending SMS Message to SVCA.");
          this.writeFetchMessage("SMS Message sent to SVCA ..."+this.state.MessageInboundStatus);

          if( this.state.MessageInboundStatus == "Success" ) {
            //To Do: Delete or mark read the SMS. MessageInboundId
            this.deleteSMS(this.state.MessageInboundId);
            this.clearInboundState();
            this.serverAccessErrorTry = 0;
          }
          else {
            this.writeFetchMessage("Unable to send to server!");
            this.serverAccessErrorTry = this.serverAccessErrorTry + 1;

            //Retry
          }
        }
        else {
          //this.writeFetchMessage("No new SMS: "+found);
        }


        if( this.serverAccessErrorTry > this.state.serverRetry && !this.state.adminTexted ) {
          //Text Admin for help once
          date = new Date();
          this.writeFetchMessage(date);
          this.writeFetchMessage("Sending SOS to Admin " + this.state.adminSMSNumber );
          this.sendSMStoAdmin(date+" From SMS Messaging System: Unable to access server properly, please check!");
          this.setState({adminTexted: true});
        }

        if( this.state.adminTexted && this.serverAccessErrorTry == 0 ) {
          date = new Date();
          this.writeFetchMessage(date);
          this.writeFetchMessage("Sending A.OK to Admin " + this.state.adminSMSNumber );
          this.sendSMStoAdmin(date+" From SMS Messaging System: Server now is accessable, you can relax now!");
          this.setState({adminTexted: false});
        }


        // End Get Next SMS Message


        timer = parseFloat(this.state.Timer) * 1000;
        await new Promise((resolve) => setTimeout(() => resolve(), timer));
        count = count+1;
      }
      //this.setState({visibleAutoFetch: false});
    })();

  }

  onPress_StopAutoFetch = () => {
    (async () => {
      this.setState({autoFetchMessage: "Stopping Auto Fetch..."});

      // Do stop here...
      this.writeFetchMessage("Finishing up auto fetch before stopping ... ");
      //newMessage = this.state.FetchMessage.concat(message);
      //this.setState({FetchMessage:newMessage});

      this.setState({FetchStatus: "STOP"})
      await new Promise((resolve) => setTimeout(() => resolve(), 5000));

      this.setState({visibleAutoFetch: false});
    })();
  }


  render() {
    const { DeleteArdIn } = this.state;
    return (

      <View style={styles.container}>
        <Header
          //placement={false}
          backgroundColor = "#0a3a1d"
          //height = {50}
          leftComponent={{ icon: 'settings', color: '#fff' }}
          centerComponent={{
            text: 'VPL, Inc. SMS Messaging',
            style: {
              color: '#fff',
              fontWeight: 'bold',
              fontSize: 15,
            } }}
          rightComponent={{
            icon: 'visibility',
            color: '#fff'
          }}
          outerContainerStyles={{height:50}}
        />
        <View style={styles.container_main}>
        <ScrollView>
        <View style={styles.itemView}>
          <TouchableOpacity
           style={styles.button}
           onPress={this.onPress_GetNextOutboundMessage}
          >
            <Text style={{color:'#ffffff'}}> Get Next Outbound Message </Text>
          </TouchableOpacity>
          <View style={[styles.messageContainer, {height:250}]}>
          <ScrollView>
            <Text style={[styles.messageText]}>
              To : { this.state.SendTo !== "" ? this.state.SendTo: null}
              {'\n'}
              Loc : { this.state.Loc !== "" ? this.state.Loc: null}
              {'\n'}{'\n'}
              Outbound SMS Message:
              {'\n'}
              { this.state.Message !== "" ? this.state.Message: null}
              {'\n'} {'\n'}
             </Text>
            </ScrollView>
          </View>
          <View style={styles.messageButtonContainer}>
            <TouchableOpacity
             style={styles.messageButton}
             onPress={this.onPress_sendSMS}
            >
              <Text style={{color:'#ffffff'}}> Send SMS </Text>
            </TouchableOpacity>

          </View>
        </View>

        <View style={styles.itemView}>
          <TouchableOpacity
             style={styles.button}
             //onPress={this.onPress_SMSMessage}
             onPress={this.onPress_GetNextSMSInboundMessages}
          >
            <Text style={{color:'#ffffff'}}> Get Next SMS (Inbound) Message </Text>
          </TouchableOpacity>
          <View style={[styles.messageContainer, {height:250}]}>
            <ScrollView>
               <Text style={[styles.messageText]}>
                 From : { this.state.ToInbound !== "" ? this.state.ToInbound: null}
                 {'\n'}{'\n'}
                 Incoming SMS Message:
                 {'\n'}
                 { this.state.MessageInbound !== "" ? this.state.MessageInbound: null}
                 {'\n'}{'\n'}
                 Message Encoded: {'\n'}
                 { this.state.MessageInboundIncoded !== "" ? this.state.MessageInboundIncoded: null}
                 {'\n'}{'\n'}
                 URI: {'\n'}
                 { this.state.MessageSendURI !== "" ? this.state.MessageSendURI: null}
               </Text>
             </ScrollView>
          </View>

          <View style={styles.messageButtonContainer}>
            <TouchableOpacity
             style={styles.messageButton}
             onPress={this.onPress_SendToSvca}
            >
              <Text style={{color:'#ffffff'}}> Send SMS to SVCA </Text>
            </TouchableOpacity>
            <View style={styles.messageButtonContainer}>

            </View>
          </View>

        </View>

        <View style={styles.itemView}>
          <View style={{backgroundColor: "#9ec4f7", marginBottom: 5}}>
            <Text> Delete message </Text>
          </View>
          <View>
            <TextInput
              style={styles.inputBox}
              onChangeText={(text) => this.setState({DeleteArdIn: text})}
              value={DeleteArdIn}
              defaultValue={DeleteArdIn}
              maxLength={10}
              placeholder="Location Number (10 digits)"
              autoFocus={false}
              keyboardType={'numeric'}
              autoCorrect={false}
              underlineColorAndroid={'transparent'}
            >
            </TextInput>
          </View>


            <View style={styles.messageButtonContainer}>
              <TouchableOpacity
               style={styles.messageButton}
               onPress={this.onPress_DeleteMessageFromSVCA}
              >
                <Text style={{color:'#ffffff'}}> Delete Message from SVCA Server </Text>
              </TouchableOpacity>
            </View>

        </View>

        <View style={styles.itemView}>
          <View style={{backgroundColor: "#9ec4f7", marginBottom: 5}}>
            <Text> Run Auto Fetch </Text>
          </View>
          <View style={styles.pickerBox}>
            <View style={{width:150, justifyContent: 'center' }}>
              <Text> Select fetch interval </Text>
            </View>
            <View style={{flex:2}}>
              <Picker
                selectedValue={this.state.Timer}
                style={{ height: 50, width: 130}}
                onValueChange={(itemValue, itemIndex) => this.setState({Timer: itemValue})}>
                <Picker.Item label="3 seconds" value="3" />
                <Picker.Item label="10 seconds" value="10" />
                <Picker.Item label="30 seconds" value="30" />
                <Picker.Item label="60 seconds" value="60" />
              </Picker>
            </View>
          </View>
          <View style={styles.messageButtonContainer}>
            <TouchableOpacity
             style={styles.messageButton}
             onPress={this.onPress_AutoFetch}
            >
              <Text style={{color:'#ffffff'}}> Run </Text>
            </TouchableOpacity>
          </View>

        </View>

        </ScrollView>
        </View>

        // Waiting window modal
        <Modal
          animationType="fade"
          transparent={true}
          visible={this.state.visibleWait}
          onRequestClose={() => {}}
          >
          <View style={{
          flex: 1,
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center'}}>
          <View style={styles.waitingView}>
             <ActivityIndicator
               size={"large"}
               color={"#098"}
             />
             <View>
               <Text
                 numberOfLines={1}
                 style={[styles.waitingText, { color: this.state.textColor }]}
               >
                 {this.state.textWait ? this.state.textWait : "Waiting..."}
               </Text>
               <Text
                 style={[
                   styles.waitingSubText,
                   { color: this.state.subTextColor }
                 ]}
                 numberOfLines={1}
               >
                 {this.state.subTextWait}
               </Text>
             </View>
           </View>
           </View>
        </Modal>


        // Auto Fetch Modal window
        <Modal
          animationType="fade"
          transparent={true}
          visible={this.state.visibleAutoFetch}
          onRequestClose={() => {}}
          >
          <View style={{
          width: this.screenWidth - 10,
          height: this.screenHeight - 100 ,
          marginTop: 60,
          marginLeft: 5,
          borderRadius: 8,
          borderWidth: 0.3,
          borderColor: '#a3a3a3',
          backgroundColor: "#cecece" }}>

            <View style={{
              flexDirection: 'row',
              marginLeft: 5,
              marginTop: 5,
              marginRight: 5,
            }}>


               <ActivityIndicator
                 size={"large"}
                 color={"#098"}
               />


               <Text
                 numberOfLines={1}
                 style={[styles.waitingText, { color: this.state.textColor }]}
               >
                 {this.state.textWait ? this.state.textWait : this.state.autoFetchMessage}
               </Text>


             </View>
             <View style={{
               height:this.screenHeight - 210,
               width:this.screenWidth-20,
               marginLeft:5,
               padding: 5,
               backgroundColor: "#eaeaea",
               borderRadius: 8,
               borderWidth: 0.5,
               borderColor: "#bcbcbc",
               marginTop: 10,
             }}>
               <ScrollView ref={ ( ref ) => this.scrollView = ref }
                  onContentSizeChange={ () => {
                  this.scrollView.scrollToEnd( { animated: false } )
                } } >
                 <Text style={{color: '#FF00FF'}}>
                   { this.state.FetchMessage !== "" ? this.state.FetchMessage: null}

                 </Text>
              </ScrollView>


             </View>
             <View style={{
               marginLeft: 10,
               marginRight: 10,
               marginTop: 15,
               height: 40,
             }}>
             <TouchableOpacity
              style={styles.button}
              onPress={this.onPress_StopAutoFetch}
             >
               <Text style={{color:'#ffffff'}}> Stop Auto Fetch </Text>
             </TouchableOpacity>
             </View>

           </View>

        </Modal>

      </View>
    );
  }
}

const styles = StyleSheet.create({
  container_main: {
    flex: 2,
    //marginTop: 20,
    backgroundColor: "#e5f9ed",
    alignItems: 'center'
  },
  container: {
    flex: 1,
  },
  welcome: {
    fontSize: 20,
    textAlign: 'center',
    margin: 10,
  },
  instructions: {
    textAlign: 'center',
    color: '#333333',
    marginBottom: 5,
  },

  button: {
    alignItems: 'center',
    backgroundColor: '#1c61ce',
    padding: 7,
    paddingHorizontal: 5,
    borderRadius: 5
  },

  messageContainer: {
    flex: 1,
    //alignItems: 'center',
    padding: 5,
    backgroundColor: "#eaeaea",
    borderRadius: 8,
    borderWidth: 1,
    marginTop: 10,
    width: 250,
    height: 200,
    marginBottom: 15
  },
  messageText: {
    color: '#FF00FF'
  },
  messageButtonContainer: {
    flex: 1,
    justifyContent: 'space-between',
    marginLeft: 10,
    marginRight: 10,
    flexDirection: 'row',
    backgroundColor: "#e5f9ed",
  },
  messageButton: {
    alignItems: 'center',
    backgroundColor: '#2b73e5',
    padding: 5,
    paddingHorizontal: 5,
    borderRadius: 5
  },
  itemView: {
    borderWidth: 1,
    borderColor: '#cccccc',
    padding: 5,
    margin: 20,
    borderWidth: 0.8,
    borderRadius: 6,
    backgroundColor: "#e5f9ed",
  },
  inputBox: {
    padding: 5,
    borderWidth: 0.8,
    borderRadius: 6,
    borderColor: '#c8c8c8',
    backgroundColor: '#e6e6e6',
    marginBottom: 5,
  },
  pickerBox: {
    flex: 1,
    flexDirection: 'row',
    marginBottom: 5,
    borderWidth: 0.8,
    borderRadius: 6,
    borderColor: '#c8c8c8',
    backgroundColor: '#e6e6e6',
  },
  autoFetchView: {
    marginTop: 60,
    borderRadius: 6,
    borderColor: '#c8c8c8',
    backgroundColor: "#f4f4f4",
  },
  waitingView: {
    padding: 15,
    marginLeft: 20,
    marginRight: 20,
    backgroundColor: "#FFF",
    flexDirection: "row",
    alignItems: "center"
  },
  waitingText: {
    fontWeight: "bold",
    fontSize: 18,
    marginLeft: 10,
    marginRight: 10
  },
  waitingSubText: {
    fontSize: 15,
    marginLeft: 10,
    marginRight: 10
  }
});
