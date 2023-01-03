"use strict";

function Command(orders, callback) {
    this.orders = orders;
    this.callback = callback;
}

function Reciever(language, commandList) {
    var self = this,
        SpeechRecognition = SpeechRecognition || webkitSpeechRecognition;
    self.recognition = new SpeechRecognition();

    self.commandList = commandList;
    self.recording = false;
    self.continuous = false;
    self.onStart = function () {};
    self.onEnd = function () {};

    self.recognition.lang = language || "pl";

    self.recognition.onaudioend = function (event) {
        self.recording = false;
        self.onEnd(event);
    };

    self.recognition.onstart = function (event) {
        self.onStart(event);
    };

    self.recognition.onresult = function (event) {
        var text = event.results[0][0].transcript,
            recognizedCommand = commandList.find(function (command) {
            var understood = command.orders.find(function (order) {
                return text.includes(order);
            });
            return command.orders.includes(understood);
        });
        if (recognizedCommand !== undefined) {
            recognizedCommand.callback(text);
        }
    };

    self.start = function () {
        self.recording = true;
        checkIfContinuous(false);
        self.recognition.start();
    };
    self.stop = function () {
        self.recording = false;
        checkIfContinuous(true);
        self.recognition.stop();
    };

    function checkIfContinuous(forceStop) {
        if (self.continuous === true && forceStop === false) {
            self.recognition.onend = function () {
                self.recording = true;
                self.recognition.start();
            };
        } else {
            self.recognition.onend = null;
        }
    }
}

//TODO przepisać na es2016
//TODO zapętlenie
//TODO zmienić domyślny język na język przeglądarki
//TODO callback z parametrem?
//TODO w parametrze wyslyszana wartosc?
'use strict';

function Speaker(content) {
    var self = this;

    var isChrome = navigator.userAgent.indexOf('Chrome') !== -1 ? true : false,
        isFirefox = navigator.userAgent.indexOf('Firefox') !== -1 ? true : false;

    self.synth = window.speechSynthesis;
    self.playing = false;
    self.paused = false;

    var sentencesArray = [],
        sentencesString = "",
        counter = 0,
        utterance = new SpeechSynthesisUtterance();
    utterance.lang = 'pl';
    utterance.volume = 0.5;
    utterance.rate = 1;
    utterance.pitch = 1;

    if (isChrome) {
        sentencesArray = sentencesArray.concat(content.replace(/<{1}[^<>]{1,}>{1}/g, " ").split(/[.!?:;]/g));
        utterance.text = sentencesArray[counter];
    }
    if (isFirefox) {
        sentencesString = sentencesString.concat(content.replace(/<{1}[^<>]{1,}>{1}/g, " "));
        utterance.text = sentencesString;
    }

    self.start = function () {
        if (!self.playing) {
            self.synth.speak(utterance);
            self.onStart();
            self.playing = true;
        }
    };
    self.resume = function () {
        if (self.playing && self.paused) {
            self.synth.resume();
            self.paused = false;
            self.onResume();
        }
    };
    self.pause = function () {
        if (self.playing && !self.paused) {
            self.synth.pause();
            self.paused = true;
            self.onPause();
        }
    };
    self.stop = function () {
        if (self.playing) {
            counter = sentencesArray.length;
            self.synth.cancel();
            self.playing = false;
        }
    };

    utterance.onend = function () {
        counter++;
        self.playing = false;
        self.paused = false;

        if (counter < sentencesArray.length) {
            utterance.text = sentencesArray[counter];
            self.synth.speak(utterance);
        } else {
            counter = 0;
            utterance.text = sentencesArray[counter];
            self.onEnd();
        }
    };

    self.onStart = function () {};
    self.onEnd = function () {};
    self.onPause = function () {};
    self.onResume = function () {};
}

//TODO napisać post dokumentacyjny
//TODO przetestować na FF
//TODO wydzielić publiczne parametry
//TODO przepisać na es2016