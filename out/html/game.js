(function() {
  var game;
  var ui;

  var DateOptions = {hour: 'numeric',
                 minute: 'numeric',
                 second: 'numeric',
                 year: 'numeric',
                 month: 'short',
                 day: 'numeric' };

  var main = function(dendryUI) {
    ui = dendryUI;
    game = ui.game;

    // Add your custom code here.
  };

  var TITLE = "Red Zenit: An Alternate History" + '_' + "Henry Blachman, inspired by Autumn Chen";

  // the url is a link to game.json
  // test url: https://aucchen.github.io/social_democracy_mods/v0.1.json
  // TODO; 
  window.loadMod = function(url) {
      ui.loadGame(url);
  };

  window.showStats = function() {
    if (window.dendryUI.dendryEngine.state.sceneId.startsWith('library')) {
        window.dendryUI.dendryEngine.goToScene('backSpecialScene');
    } else {
        window.dendryUI.dendryEngine.goToScene('library');
    }
  };

  window.showMods = function() {
    window.hideOptions();
    if (window.dendryUI.dendryEngine.state.sceneId.startsWith('mod_loader')) {
        window.dendryUI.dendryEngine.goToScene('backSpecialScene');
    } else {
        window.dendryUI.dendryEngine.goToScene('mod_loader');
    }
  };
  
  window.showOptions = function() {
      var save_element = document.getElementById('options');
      window.populateOptions();
      save_element.style.display = "block";
      if (!save_element.onclick) {
          save_element.onclick = function(evt) {
              var target = evt.target;
              var save_element = document.getElementById('options');
              if (target == save_element) {
                  window.hideOptions();
              }
          };
      }
  };

  window.hideOptions = function() {
      var save_element = document.getElementById('options');
      save_element.style.display = "none";
  };

  window.disableBg = function() {
      window.dendryUI.disable_bg = true;
      document.body.style.backgroundImage = 'none';
      window.dendryUI.saveSettings();
  };

  window.enableBg = function() {
      window.dendryUI.disable_bg = false;
      window.dendryUI.setBg(window.dendryUI.dendryEngine.state.bg);
      window.dendryUI.saveSettings();
  };

  window.disableAnimate = function() {
      window.dendryUI.animate = false;
      window.dendryUI.saveSettings();
  };

  window.enableAnimate = function() {
      window.dendryUI.animate = true;
      window.dendryUI.saveSettings();
  };

  window.disableAnimateBg = function() {
      window.dendryUI.animate_bg = false;
      window.dendryUI.saveSettings();
  };

  window.enableAnimateBg = function() {
      window.dendryUI.animate_bg = true;
      window.dendryUI.saveSettings();
  };

  window.disableAudio = function() {
      window.dendryUI.toggle_audio(false);
      window.dendryUI.saveSettings();
  };

  window.enableAudio = function() {
      window.dendryUI.toggle_audio(true);
      window.dendryUI.saveSettings();
  };

  window.enableImages = function() {
      window.dendryUI.show_portraits = true;
      window.dendryUI.saveSettings();
  };

  window.disableImages = function() {
      window.dendryUI.show_portraits = false;
      window.dendryUI.saveSettings();
  };

  window.enableLightMode = function() {
      window.dendryUI.dark_mode = false;
      document.body.classList.remove('dark-mode');
      window.dendryUI.saveSettings();
  };
  window.enableDarkMode = function() {
      window.dendryUI.dark_mode = true;
      document.body.classList.add('dark-mode');
      window.dendryUI.saveSettings();
  };

  // populates the checkboxes in the options view
  window.populateOptions = function() {
    var disable_bg = window.dendryUI.disable_bg;
    var animate = window.dendryUI.animate;
    var disable_audio = window.dendryUI.disable_audio;
    var show_portraits = window.dendryUI.show_portraits;
    if (disable_bg) {
        $('#backgrounds_no')[0].checked = true;
    } else {
        $('#backgrounds_yes')[0].checked = true;
    }
    if (animate) {
        $('#animate_yes')[0].checked = true;
    } else {
        $('#animate_no')[0].checked = true;
    }
    if (disable_audio) {
        $('#audio_no')[0].checked = true;
    } else {
        $('#audio_yes')[0].checked = true;
    }
    if (show_portraits) {
        $('#images_yes')[0].checked = true;
    } else {
        $('#images_no')[0].checked = true;
    }
    if (window.dendryUI.dark_mode) {
        $('#dark_mode')[0].checked = true;
    } else {
        $('#light_mode')[0].checked = true;
    }
  };

  
  // This function allows you to modify the text before it's displayed.
  // E.g. wrapping chat-like messages in spans.
  window.displayText = function(text) {
      return text;
  };

  // This function allows you to do something in response to signals.
  window.handleSignal = function(signal, event, scene_id) {
  };
  
  // This function runs on a new page. Right now, this auto-saves.
  window.onNewPage = function() {
    var scene = window.dendryUI.dendryEngine.state.sceneId;
    if (scene != 'root' && !window.justLoaded) {
        window.dendryUI.autosave();
    }
    if (window.justLoaded) {
        window.justLoaded = false;
    }
  };

  // TODO: have some code for tabbed sidebar browsing.
  window.updateSidebar = function() {
      $('#qualities').empty();
      var scene = dendryUI.game.scenes[window.statusTab];
      dendryUI.dendryEngine._runActions(scene.onArrival);
      var displayContent = dendryUI.dendryEngine._makeDisplayContent(scene.content, true);
      $('#qualities').append(dendryUI.contentToHTML.convert(displayContent));
  };

  window.changeTab = function(newTab, tabId) {
      if (tabId == 'poll_tab' && dendryUI.dendryEngine.state.qualities.historical_mode) {
          window.alert('Polls are not available in historical mode.');
          return;
      }
      var tabButton = document.getElementById(tabId);
      var tabButtons = document.getElementsByClassName('tab_button');
      for (i = 0; i < tabButtons.length; i++) {
        tabButtons[i].className = tabButtons[i].className.replace(' active', '');
      }
      tabButton.className += ' active';
      window.statusTab = newTab;
      window.updateSidebar();
  };

  window.onDisplayContent = function() {
      window.updateSidebar();
  };

  /*
   * This function copied from the code for Infinite Space Battle Simulator
   *
   * quality - a number between max and min
   * qualityName - the name of the quality
   * max and min - numbers
   * colors - if true/1, will use some color scheme - green to yellow to red for high to low
   * */
  window.generateBar = function(quality, qualityName, max, min, colors) {
      var bar = document.createElement('div');
      bar.className = 'bar';
      var value = document.createElement('div');
      value.className = 'barValue';
      var width = (quality - min)/(max - min);
      if (width > 1) {
          width = 1;
      } else if (width < 0) {
          width = 0;
      }
      value.style.width = Math.round(width*100) + '%';
      if (colors) {
          value.style.backgroundColor = window.probToColor(width*100);
      }
      bar.textContent = qualityName + ': ' + quality;
      if (colors) {
          bar.textContent += '/' + max;
      }
      bar.appendChild(value);
      return bar;
  };


  window.justLoaded = true;
  window.statusTab = "status";
  window.dendryModifyUI = main;
  console.log("Modifying stats: see dendryUI.dendryEngine.state.qualities");

  // --- Click sound effects ---
  var _clickCtx = null;
  function _getClickCtx() {
      if (!_clickCtx) {
          _clickCtx = new (window.AudioContext || window.webkitAudioContext)();
      }
      return _clickCtx;
  }

  function playClickSound(isChoice) {
      if (window.dendryUI && window.dendryUI.disable_audio) return;
      try {
          var ctx = _getClickCtx();
          var now = ctx.currentTime;

          // Variation: gain and filter resonance only — pitch stays fixed
          var gainVar = 0.88 + Math.random() * 0.24;
          var qVar    = 1.8 + Math.random() * 2.5;

          // --- Initial snap: very short broadband burst for the sharp transient ---
          var snapDur = 0.009;
          var snapBuf = ctx.createBuffer(1, Math.ceil(ctx.sampleRate * snapDur), ctx.sampleRate);
          var snapData = snapBuf.getChannelData(0);
          for (var i = 0; i < snapData.length; i++) snapData[i] = Math.random() * 2 - 1;
          var snapSrc = ctx.createBufferSource();
          snapSrc.buffer = snapBuf;
          var snapGain = ctx.createGain();
          snapGain.gain.setValueAtTime((isChoice ? 0.55 : 0.40) * gainVar, now);
          snapGain.gain.exponentialRampToValueAtTime(0.001, now + snapDur);
          snapSrc.connect(snapGain);
          snapGain.connect(ctx.destination);
          snapSrc.start(now);
          snapSrc.stop(now + snapDur + 0.002);

          // --- Filtered noise body: analogue texture after the snap ---
          var noiseDur = isChoice ? 0.055 : 0.038;
          var noiseBuf = ctx.createBuffer(1, Math.ceil(ctx.sampleRate * noiseDur), ctx.sampleRate);
          var noiseData = noiseBuf.getChannelData(0);
          for (var i = 0; i < noiseData.length; i++) noiseData[i] = Math.random() * 2 - 1;
          var noiseSrc = ctx.createBufferSource();
          noiseSrc.buffer = noiseBuf;
          var bp = ctx.createBiquadFilter();
          bp.type = 'bandpass';
          bp.frequency.value = isChoice ? 1100 : 1900;
          bp.Q.value = qVar;
          var noiseGain = ctx.createGain();
          noiseGain.gain.setValueAtTime((isChoice ? 0.52 : 0.40) * gainVar, now);
          noiseGain.gain.exponentialRampToValueAtTime(0.001, now + noiseDur);
          noiseSrc.connect(bp);
          bp.connect(noiseGain);
          noiseGain.connect(ctx.destination);
          noiseSrc.start(now);
          noiseSrc.stop(now + noiseDur + 0.01);

          // --- Low thud: weight beneath the click, fixed pitch ---
          var osc = ctx.createOscillator();
          osc.type = 'triangle';
          var thudDur = isChoice ? 0.13 : 0.08;
          osc.frequency.setValueAtTime(isChoice ? 210 : 310, now);
          osc.frequency.exponentialRampToValueAtTime(isChoice ? 75 : 130, now + thudDur);
          var oscGain = ctx.createGain();
          oscGain.gain.setValueAtTime((isChoice ? 0.38 : 0.26) * gainVar, now);
          oscGain.gain.exponentialRampToValueAtTime(0.001, now + thudDur);
          osc.connect(oscGain);
          oscGain.connect(ctx.destination);
          osc.start(now);
          osc.stop(now + thudDur + 0.01);

      } catch(e) {}
  }

  document.addEventListener('click', function(e) {
      var target = e.target;
      // Choice links inside the story content get the heavier sound
      var inContent = target.closest && target.closest('#content');
      if (inContent) {
          if (target.tagName === 'A' || target.closest('a')) {
              playClickSound(true);
              return;
          }
      }
      // Everything else: tab buttons, header links, save/load, etc.
      if (target.tagName === 'A' || target.tagName === 'BUTTON' ||
          (target.closest && (target.closest('a') || target.closest('button')))) {
          playClickSound(false);
      }
  }, true);
  // --- End click sounds ---

  window.onload = function() {
    window.dendryUI.loadSettings({show_portraits: true});
    if (window.dendryUI.dark_mode) {
        document.body.classList.add('dark-mode');
    }
    window.pinnedCardsDescription = "Advisor cards - actions are only usable once per 6 months.";
  };

}());
(function () {
  function upgrade(el) {
    const raw = el.getAttribute("title");
    if (raw == null) return;

    // turn literal "\n" into real newlines
    const text = String(raw).replace(/\\n/g, "\n");

    el.setAttribute("data-tooltip", text);
    el.removeAttribute("title"); // stop native tooltip
  }

  // Upgrade on hover/focus (works for dynamically added content)
  document.addEventListener("mouseover", (e) => {
    const el = e.target && e.target.closest ? e.target.closest(".tooltip-text[title]") : null;
    if (el) upgrade(el);
  }, true);

  document.addEventListener("focusin", (e) => {
    const el = e.target && e.target.closest ? e.target.closest(".tooltip-text[title]") : null;
    if (el) upgrade(el);
  }, true);
})();
