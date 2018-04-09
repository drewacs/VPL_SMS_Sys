/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 * @flow
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
  Picker
} from 'react-native';

import SmsAndroid  from 'react-native-get-sms-android';

const message = '{ "Inbound" : [' +
  '{ "address": "4152223355", "body": "This is a test message ", "state": "false"},' +
  '{ "address": "5122259242", "body": "Hello world 2444 921? What!", "state": "false" }, ' +
  '{ "address": "3124455678", "body": "Then, use the JavaScript built-in function JSON.parse() to convert the string into a JavaScript object!", "state": "false" }, ' +
  '{ "address": "2021445533", "body": "Not all naturals are coordinators!!", "state": "false"} ]}';

var sms = JSON.parse(message);

/* List SMS messages matching the filter */
var filter = {
    box: 'inbox', // 'inbox' (default), 'sent', 'draft', 'outbox', 'failed', 'queued', and '' for all
    // the next 4 filters should NOT be used together, they are OR-ed so pick one
    read: 0, // 0 for unread SMS, 1 for SMS already read
    //_id: 1234, // specify the msg id
    //address: '+1888------', // sender's phone number
    //body: 'How are you', // content to match
    // the next 2 filters can be used for pagination
    //indexFrom: 0, // start from index 0
    //maxCount: 10, // count of SMS to return each time
    //box: 'inbox',
    //maxCount: 10,

};

var sms_data = null;
var sms_count;



type Props = {};
export default class App extends Component<Props> {

  constructor(props) {
      super(props)
      this.state = {
        Message: "",
        To: "",
        Loc: "",
        MessageEncoded: "",
        ToInbound: "",
        MessageInbound: "",
        MessageInboundIncoded: "",
        MessageSendURI: "",
        MessageInboundId: "",
        DeleteArdIn: "",
        Timer: "3"
      }
  }

  onPress_Retrieve = () => {
    this.setState({
      To: "",
      Message: "",
      MessageEncoded: ""
    });
    fetch('http://www.svcausa.com/smsgprs/smsread.php')
    .then((resp)=>{ return resp.text() })
    .then((text)=>{
      //console.log(text)
      location = text.substring(text.lastIndexOf("LOCATION:")+10, text.lastIndexOf(" ~<br>TO"));
      to = text.substring(text.lastIndexOf("TO:")+4, text.lastIndexOf(" ~<br>MSG"));

      msg = text.substring(text.lastIndexOf("MSG:")+5, text.lastIndexOf(" ~<br>END"));
      msg_encoded = encodeURI(msg);
      this.setState({
        To: to,
        Message: msg,
        MessageEncoded: msg_encoded,
        Loc: location
      })
    }).catch((error) => {
      Alert.alert('Error',error);
    });
  }

  clearOutboundState() {
    this.setState(
      {
        To: "",
        Message: "",
        MessageEncoded: "",
        Loc: "",
      }
    );
  }

  onPress_sendSMS = () => {
    if( this.state.Message ) {
      //Todo: Send Message to SMS
      Alert.alert("Message Sent to " + this.state.To, this.state.Message);
    }
    else {
      Alert.alert("Unable to send SMS!", "No Message provided.")
    }

    this.clearOutboundState();
  }

  onPress_markSentSMS = () => {
    if( this.state.Loc ) {
      //Todo: Send Message to SMS
      Alert.alert("Mark message as Sent ", "Location: " + this.state.Loc);
    }
    else {
      Alert.alert("Unable to mark message sent!", "No Message Location provided.")
    }

    this.clearOutboundState();
  }


  clearInboundState() {
    this.setState(
      {
        ToInbound: "",
        MessageInbound: "",
        MessageInboundIncoded: "",
        MessageSendURI: "",
        MessageInboundId: "",
      }
    );
  }

  onPress_InboundMsg = () => {
    var i;
    var found = false;
    if( Math.round(Math.random())) {
      for (i=0; i< sms.Inbound.length; i++ ) {

        if(sms.Inbound[i].state == "false") {
          msg = encodeURIComponent(sms.Inbound[i].body);
          uri = "http://www.svcausa.com/smsgprs/smssend.php?to="+sms.Inbound[i].address+"&msg="+msg;
          this.setState(
            {
              ToInbound: sms.Inbound[i].address,
              MessageInbound: sms.Inbound[i].body,
              MessageInboundIncoded: msg,
              MessageSendURI: uri,
            }
          );
          sms.Inbound[i].state = "true";
          found = true;
          break;
        }
      }
      if (found == false) {
        sms =  JSON.parse(message);
        this.clearInboundState();
      }
    }
    else {
      this.clearInboundState();
    }
  }


  onPress_SMSMessage = () => {
    var found = false;
    var i;

    //Alert.alert("Retrieving SMS Messages ...");
    if (sms_data == null ) {
      SmsAndroid.list(JSON.stringify(filter), (fail) => {
              //console.log("Failed with this error: " + fail)
              Alert.alert("Failed to read SMS message", fail);
              sms_count = 0;
              sms_data = null;
          },
          (count, smsList) => {
              //console.log('Count: ', count);
              //console.log('List: ', smsList);
              sms_data = JSON.parse(smsList);
              sms_count = count;
              //Alert.alert("SMS messages retrieved", "SMS count: " + sms_count );
              //sms_data.forEach(function(object){
              //    console.log("Object: " + object);
              //    console.log("-->" + object.date);
              //    console.log("-->" + object.body);
              //})
          });
      }


      if( sms_count > 0 ) {
        //sms_data.forEach(function(object){
        for (i=0; i< sms_data.length; i++ ) {
            object = sms_data[i];
            //console.log("Object: " + object);
            //console.log("-->" + object.date);
            //console.log("-->" + object.body);

            if(object.read == 0) {
              msg = encodeURIComponent(object.body);
              msg.replace(/%0A/gi, '`');
              uri = "http://www.svcausa.com/smsgprs/smssend.php?to="+object.address+"&msg="+msg;
              this.setState(
                {
                  ToInbound: object.address,
                  MessageInbound: object.body,
                  MessageInboundId: object._id,
                  MessageInboundIncoded: msg,
                  MessageSendURI: uri,
                }
              );
              //Delete instead of just marking Read in final version.
              object.read = 1;
              found = true;
              break;
            }

        }
      }

      if (found == false) {
           Alert.alert("No more unread SMS message!");
           sms_data = null;
           sms_count = 0;
           this.clearInboundState();
      }

  }


  onPress_SendToSvca = () => {
    if( this.state.MessageSendURI ) {
      fetch(this.state.MessageSendURI)
      .then((resp)=>{
        //Alert.alert('Send Status', resp.ok)
        return resp.text()
      })
      .then((text)=>{
        result = text.substring(text.lastIndexOf("RESULT:")+8, text.lastIndexOf("<br>TRNO"));
        trno = text.substring(text.lastIndexOf("TRNO:")+6, text.lastIndexOf(".<br>"));

        if( result == 'OK') {
          Alert.alert("Send to SVCA Success!", "TR No: " + trno );
        }
        else {
          Alert.alert("Failed to send SMS to SVCA!")
        }
        //Alert.alert('Send Status', text);
      })
      .catch((error) => {
        Alert.alert('Send to SVCA Failed',error);
      });
    } else
    {
      Alert.alert("Failed to send SMS to SVCA!", "No SMS message to send.")
    }
  }

  onPress_DeleteMessagePermanent = () => {
    if( this.state.DeleteArdIn ) {

      uri = "http://www.svcausa.com/smsgprs/smsdelete.php?loc="+this.state.DeleteArdIn+"*";

      fetch(uri)
      .then((resp)=>{
        //Alert.alert('Send Status', resp.ok)
        return resp.text()
      })
      .then((text)=>{
        result = text.substring(text.lastIndexOf("RESULT:")+8, text.lastIndexOf("."));

        if( result == 'OK') {
          Alert.alert("Delete ARD_IN Message from SVCA", "Success");
        }
        else {
          Alert.alert("Failed to delete ARD_IN message from SVCA!", result)
        }
        //Alert.alert('Send Status', text);
      })
      .catch((error) => {
        Alert.alert('Error communicating to SVCA Server',error);
      });
    }
    else {
      Alert.alert("Unable to delete ARD_IN message from SVCA!", "No Location number provided.")
    }

    this.setState({ DeleteArdIn: "" });

  }


  onPress_AutoFetch = () => {
    Alert.alert("Running auto fetch ", "Fetch every " + this.state.Timer + " seconds ...");
  }

  render() {
    const { DeleteArdIn } = this.state;
    return (
      <View style={styles.container}>

        <View style={styles.header}>
        <Text style={styles.welcome}>
          Valley Prime Logistics, Inc.
        </Text>
        <Text style={styles.instructions}>
          SMS Messaging System (Alpha 1.0)
        </Text>
        </View>


        <View style={styles.container_main}>
        <ScrollView>


        <View style={styles.itemView}>
          <TouchableOpacity
           style={styles.button}
           onPress={this.onPress_Retrieve}
          >
            <Text style={{color:'#ffffff'}}> Get Next Outbound Message </Text>
          </TouchableOpacity>
          <View style={[styles.messageContainer, {height:150}]}>
          <ScrollView>
            <Text style={[styles.messageText]}>
              To : { this.state.To !== "" ? this.state.To: null}
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
            <View style={styles.messageButtonContainer}>
              <TouchableOpacity
               style={styles.messageButton}
               onPress={this.onPress_markSentSMS}
              >
                <Text style={{color:'#ffffff'}}> Mark Sent </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        <View style={styles.itemView}>
          <TouchableOpacity
             style={styles.button}
             onPress={this.onPress_SMSMessage}
          >
            <Text style={{color:'#ffffff'}}> Get Next SMS (Inbound) Message </Text>
          </TouchableOpacity>
          <View style={[styles.messageContainer]}>
            <ScrollView>
               <Text style={[styles.messageText]}>
                 To : { this.state.ToInbound !== "" ? this.state.ToInbound: null}
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
              <TouchableOpacity
               style={styles.messageButton}
               //onPress={this.onPress_Retrieve}
              >
                <Text style={{color:'#ffffff'}}> Delete SMS </Text>
              </TouchableOpacity>
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
              autoCorrect={false}

            >
            </TextInput>
          </View>

            <View style={styles.messageButtonContainer}>
              <TouchableOpacity
               style={styles.messageButton}
               onPress={this.onPress_DeleteMessagePermanent}
              >
                <Text style={{color:'#ffffff'}}> Delete Message from SVCA Server </Text>
              </TouchableOpacity>
            </View>

        </View>

        <View style={styles.itemView}>
          <View style={{backgroundColor: "#9ec4f7", marginBottom: 5}}>
            <Text> Run Auto Fetch </Text>
          </View>
          <View style={{flex:1, flexDirection: 'row',backgroundColor: '#e6e6e6', marginBottom: 5 }}>
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
              <Text style={{color:'#ffffff'}}> Run Auto Fetch </Text>
            </TouchableOpacity>
          </View>

        </View>

        </ScrollView>
        </View>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container_main: {
    flex: 2,
    marginTop: 20,
    //backgroundColor: "#65ff00",
    alignItems: 'center'
  },
  header: {
    //flex: 1,
    height: 80,
    alignItems: 'center',
    backgroundColor: "#fc9c02",
    borderWidth: 0.5
  },
  container: {
    flex: 1,
    //justifyContent: 'center',
    //alignItems: 'center',
    //backgroundColor: '#F5FCFF',
    //paddingHorizontal: 10,
    //backgroundColor: "#fffa00"
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
  button: {
    alignItems: 'center',
    backgroundColor: '#1c61ce',
    padding: 7,
    paddingHorizontal: 5,
    borderRadius: 5
  },

  messageContainer: {
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
    //justifyContent: 'flex-start',
    flex: 1,
    justifyContent: 'space-between',
    marginLeft: 10,
    marginRight: 10,
    //alignItems: 'stretch',
    flexDirection: 'row'
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
  },
  inputBox: {
    padding: 5,
    borderWidth: 0.5,
    borderRadius: 6,
    borderColor: '#c8c8c8',
    backgroundColor: '#e6e6e6',
    marginBottom: 5
  }
});
