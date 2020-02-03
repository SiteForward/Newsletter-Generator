var issuedUpdateNotice = false;
Vue.config.errorHandler = function (err, vm, info) {
   if(!issuedUpdateNotice && err.toString().match(/TypeError: \w* is not a function/g)){
    alert("The Newsletter Generator is currently updating, please come back later.");
    issuedUpdateNotice = true;
  }
 }
Vue.component('editabletext', {
  template: '<p contentEditable="true" class="contentEditable" @input="updateInput" @keydown="customShortcuts"></p>',
  props: ['value'],
  methods: {
    updateInput(e){
      this.$emit('input', this.$el.innerHTML);
    },
    customShortcuts(e){
      console.log(e.keyCode);
      if(e.ctrlKey)
        if(e.keyCode == 76){
          e.preventDefault();
          document.execCommand("justifyLeft");
        }
        else if(e.keyCode == 82){
          e.preventDefault();
          document.execCommand("justifyRight");
        }
        else if(e.keyCode == 69 || e.keyCode == 67){
          e.preventDefault();
          document.execCommand("justifyCenter");
        }
        else if(e.keyCode == 74){
          e.preventDefault();
          document.execCommand("justifyFull");
        }
    }
  },
  mounted(){
    if(typeof this.value != 'undefined')
      this.$el.innerHTML = this.value;
  }
});

let app = new Vue({
  el: '#body-wrapper',
  props:{
  },
  data: {
    sidebarHover: false,
    sidebarStuck: false,
    wordSupport: false,
    editHTML: false,
    activeView: "setup",
    silentToggle: [],
    colors:{
      button: "#06874E",
      links: "#06874E",
      header: {
        background: "#333333",
        text: "#ffffff"
      },
      posts:{
        background: "#f3f3f3",
        text: "#000000"
      },
      footer: {
        background: "#333333",
        text: "#ffffff"
      }
    },
    analytics: {
      code: null,
      name: null
    },
    header: {
      style: 0,
      image: null,
      title: null,
      subtitle: null,
      html: null
    },
    footer: {
      style: 0,
      html: null,
      preset: {
        name: null,
        email: null,
        phone: null,
        website: null,
        social: {
          facebook: null,
          linkedin: null,
          twitter: null
        },
        location: {
          address: null,
          city: null,
          province: null,
          postal: null
        },
        useDisclaimer: true
      }
    },
    posts: [],
    newsletterHTML: ""
  },
  computed: {
    analyticsEnabled: function(){
      return this.analytics.code && this.analytics.name;
    }
  },
  watch:{
    wordSupport: function(){
      if(!this.silentToggle.includes('wordSupport'))
        sendInfo("Word support turned "+(this.wordSupport ? "on" : "off"));
    },
    editHTML: function(){
      if(!this.silentToggle.includes('editHTML'))
        sendInfo("Edit HTML support turned "+(this.editHTML ? "on" : "off"));
    },
    'footer.preset.useDisclaimer': function(){
      if(!this.silentToggle.includes('footer.preset.useDisclaimer'))
        sendInfo("Manulife Securities Disclaimer turned "+(this.footer.preset.useDisclaimer ? "on" : "off"));
    },
    activeView: function(){
      let activeView = this.activeView,
          preview = this.$refs.preview;

      setTimeout(function(){
        if(activeView == "help")
          preview.classList.add("closed");
        else
          preview.classList.remove("closed");
      }, 1);
    }
  },
  mounted(){
    if(localStorage.options)
      this.$snotify.info('Did you want to load local options', {
        timeout: 5000,
        showProgressBar: true,
        closeOnClick: true,
        pauseOnHover: true,
        buttons: [
          {text: 'Yes',  action: (toast) => {this.loadOptions(); this.$snotify.remove(toast.id);}},
          {text: 'No'},
        ]
      });
      if(localStorage.posts)
        this.$snotify.info('Did you want to load local posts', {
          timeout: 5000,
          showProgressBar: true,
          closeOnClick: true,
          pauseOnHover: true,
          buttons: [
            {text: 'Yes', action: (toast) => {this.loadPosts(); this.$snotify.remove(toast.id);}},
            {text: 'No'},
          ]
        });
  },
  methods: {
    postColor: function(pos, key){
      return typeof this.posts[pos][key] == 'undefined' ? this.colors.posts[key] : this.posts[pos][key];
    },
    updateData(){
      //Update useDisclaimer
      if(typeof this.footer.preset.useDisclaimer == 'undefined')
        this.$set(this.footer.preset, "useDisclaimer", true);

      //Update Post Colours
      if(typeof this.colors.posts == 'undefined')
          this.$set(this.colors, "posts", {});
      if(typeof this.colors.posts.background == 'undefined')
          this.$set(this.colors.posts, "background", "#f3f3f3");
      if(typeof this.colors.posts.text == 'undefined')
          this.$set(this.colors.posts, "text", "#000000");
    },
    loadPosts(posts){
      if((!posts || posts.target) && localStorage.posts)
        posts = JSON.parse(localStorage.posts);

      if(!posts || posts.target)
        sendError("Unable to load posts");
      else{
        sendSuccess("Posts Loaded");
        this.posts = posts;
      }
    },
    loadOptions(options){
      if((!options || options.target) && localStorage.options)
        options = JSON.parse(localStorage.options);

      if(!options || options.target)
        sendError("Unable to load options");
      else{
        if(options.loadPosts)
          this.$refs.loadPosts.value = options.loadPosts;
        if(options.loadPost)
          this.$refs.loadPost.value = options.loadPost;
        if(options.header)
          this.header = options.header;
        if(options.footer)
          this.footer = options.footer;
        if(options.colors)
          this.colors = options.colors;
        if(options.analytics)
          this.analytics = options.analytics;
        if(options.editHTML)
          this.editHTML = options.editHTML;

        this.updateData();
        sendSuccess("Options Loaded");
      }
    },
    savePosts(){
      sendSuccess("Posts Saved");
      localStorage.setItem("posts", JSON.stringify(this.posts));
    },
    saveOptions(){
      sendSuccess("Options Saved");
      localStorage.setItem("options", JSON.stringify({
        loadPosts: this.$refs.loadPosts.value,
        loadPost: this.$refs.loadPost.value,
        header: this.header,
        footer: this.footer,
        colors: this.colors,
        analytics: this.analytics,
        editHTML: this.editHTML
      }));
    },
    exportPosts(){
      exportJSONToFile(this.posts, "Newsleter - Posts.json");
    },
    exportOptions(){
        exportJSONToFile({
          loadPosts: this.$refs.loadPosts.value,
          loadPost: this.$refs.loadPost.value,
          header: this.header,
          footer: this.footer,
          colors: this.colors,
          analytics: this.analytics,
          editHTML: this.editHTML
        }, "Newsleter - Options.json");
    },
    importPosts(){
      loadJSONFile(d => this.loadPosts(d));
    },
    importOptions(){
      loadJSONFile(d => this.loadOptions(d));
    },
    loadPostsFromURL(){
      var url = this.$refs.loadPosts.value;
      if(!url || url.length < 0)
        sendError("Invalid load Page\'s URL");
      else{
        sendInfo("Loading Posts");
        fetch(url+'/feed.xml')
        .then(res=>res.text())
        .then(data => {
          let doc = (new DOMParser()).parseFromString(data, "application/xml");
          //Search through the XML for the nodes
     	   let channels = doc.querySelector("channel");
     	   let items = channels.querySelectorAll("item");
         let maxCount = this.$refs.loadPostsCount.value;

     	   //For every blog found get the values and create a blog item
     	   items.forEach((item , i) => {
            if(i < maxCount){

       	      let post = {};
       	      //Remove the prefix of the node values
       	      let title = item.querySelector("title").innerHTML;
       	      let titlePrefix = '<![CDATA[';

       	      title = title.substr(titlePrefix.length, title.length - 3 - titlePrefix.length);
       	      let link = item.querySelector("link").innerHTML;
       	      let img = item.getElementsByTagName("media:thumbnail")[0];
       	      if (img)
       	         img = img.attributes[0].nodeValue;
       	      let desc = item.querySelector("description");
       	      if (desc) {
       	         desc = desc.innerHTML;
       	         desc = desc.substr(titlePrefix.length, desc.length - 3 - titlePrefix.length);
       	      }

       	      //Format the date
       	      let date = item.querySelector("pubDate").innerHTML;
       	      if (date) {
       	         date = date.split(' ');
       	         date = date.slice(0, 4);
       	         date = date.join(' ');
       	      }

       	      //Create the blog post item, and add it to the list
       	      post.title = title;
       	      post.date = date;
       	      post.link = link;
       	      post.img = img;
       	      post.desc = desc;
       	     this.posts.push(post);
           }
     	   });
         if(items.length > 0)
          sendSuccess("Loaded Posts");
         else
          sendError("No posts were found");

         gtag('event', 'Page', {
           'event_category': 'Loading Posts',
           'event_label': url,
           'event_value': maxCount
         });
        })
        .catch(error => sendError("Unable to load URL", error));
      }
    },
    loadPostFromURL(){
      var url = this.$refs.loadPost.value;
      if(!url || url.length < 0)
        sendError("Invalid load Page\'s URL");
      else{
        sendInfo("Loading Posts");
        fetch(url)
        .then(res => res.text())
        .then(data =>{
          let post = {};
          let doc = (new DOMParser()).parseFromString(data, "text/html");

          //See if the description can be found
          let pTags = doc.querySelector(".post-content").querySelectorAll("p");
          let p = pTags[0];
          let i = 1;
          while(p.textContent == null || p.textContent.length == 0){
            if(i + 1 > pTags.length){
              p = pTags[0];
              break;
            }
            p = pTags[i++];
          }
          let desc = p.textContent.split(" ");
          desc = desc.slice(0, Math.min(desc.length, 30)).join(" ");
          if (desc && desc[desc.length - 1].match(/\W/g))
             desc = desc.substr(0, desc.length - 1);
          if (desc)
             desc += "...";
          post.desc = desc;

          //Get the rest of the values as they will be found
          post.title = doc.querySelector(".post").querySelector(".post-title").innerHTML;
          post.link = url;
          post.date = doc.querySelector(".post").querySelector(".post-meta").querySelector("time").innerHTML;

          //Check for a thumbnail
          if (doc.querySelector(".post").querySelector(".post-thumbnail"))
             post.img = doc.querySelector(".post").querySelector(".post-thumbnail").querySelector("img").src;

          this.posts.push(post);

          sendSuccess("Loaded Posts");
          gtag('event', 'Post', {
            'event_category': 'Loading Posts',
            'event_label': url
          });
         })
         .catch(error => sendError("Unable to load URL", error));
      }
    },
    findAnalyticsCode(){
      sendInfo("Searching for Google Analytics Code");
      let websiteURL = this.$refs.analyticsWebURL.value;
      if(websiteURL.indexOf('http') != 0)
        websiteURL = "https://"+websiteURL;
      fetch(websiteURL)
      .then(res => res.text())
      .then(data =>{
        let analyticsCode = data.match(/UA-\w*-1/g);
        this.analytics.code = analyticsCode;

        if(analyticsCode != null)
          sendSuccess("Found Analytics Code: " + analyticsCode);
        else
          sendError("Unable to find Google Analytics Code");
      })
      .catch(error => sendError("Unable to find Google Analytics Code", error));;
    },
    toggleEditHTMLSilently(){
      this.silentToggle.push('editHTML');
      this.editHTML = true;
      setTimeout(function(){
        app.editHTML = false;
        setTimeout(function(){
          app.silentToggle.splice(app.silentToggle.indexOf('editHTML'), 1);
        },1);
      },1);
    },
    deletePost(pos){
      sendSuccess("Deleted Post");
      this.posts.splice(pos, 1);
      this.toggleEditHTMLSilently();
    },
    movePost(dir, pos){
      sendSuccess("Moved Post");
      moveItem(this.posts, pos, dir);
      this.toggleEditHTMLSilently();
    },
    editPost(pos, key, value){
      this.posts[pos][key] = value;
      this.toggleEditHTMLSilently();
    },
    addPost(){
      sendSuccess("Added New Post");
      this.posts.push({
        title: 'New Post',
        desc: 'New Desc'
      });
    },
    copyNewsletter(){
      selectElementContents(this.$refs.newsletter);
      document.execCommand('copy');
      if (window.getSelection) window.getSelection().removeAllRanges();
      sendSuccess("Copied Newsletter");
    },
    copyNewsletterCode(){
      if(copyTextToClipboard(this.$refs.newsletter.outerHTML))
        sendSuccess("Copied HTML Code");
    },
    isLight(color){
      let res = isLightColor(color);
      return res;
    },
    scrollToTop () {
      this.$refs.main.scrollTop = 0
    }
  },
  updated(){
    this.newsletterHTML = this.$refs.newsletter.outerHTML;
  }
});
// Load JSON File
function loadJSONFile(cb){
  var div = document.createElement("div"),
   input = document.createElement("input");
   input.type="file";
 	 div.style.width = "0";
 	 div.style.height = "0";
 	 div.style.position = "fixed";
   document.body.appendChild(div);
   div.appendChild(input);
   var ev = new MouseEvent("click",{});
   input.dispatchEvent(ev);
   input.addEventListener('change', function(e){
     let file = e.target.files[0];
     let reader = new FileReader();
     reader.readAsText(file);
     reader.onload = function(){
       let res = JSON.parse(reader.result);
       cb(res);
       document.body.removeChild(div);
     }
   });
}

//Export JSON File
function exportJSONToFile(obj, fileName){
  var json = JSON.stringify(obj);    // test -> localStorage
  var file = new File([json], fileName, {type: "text/txt"});
  var blobUrl = (URL || webkitURL).createObjectURL(file);
	var div = document.createElement("div"),
	   anch = document.createElement("a");

	document.body.appendChild(div);
	div.appendChild(anch);

	anch.innerHTML = "&nbsp;";
	div.style.width = "0";
	div.style.height = "0";
	anch.href = blobUrl;
	anch.download = fileName;

	var ev = new MouseEvent("click",{});
	anch.dispatchEvent(ev);
	document.body.removeChild(div);
}

// Is the color light
function isLightColor(color) {

  // Check the format of the color, HEX or RGB?
  if (color.match(/^rgb/)) {

    // If HEX --> store the red, green, blue values in separate variables
    color = color.match(/^rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*(\d+(?:\.\d+)?))?\)$/);

    r = color[1];
    g = color[2];
    b = color[3];
  }
  else {

    // If RGB --> Convert it to HEX: http://gist.github.com/983661
    color = +("0x" + color.slice(1).replace(
      color.length < 5 && /./g, '$&$&'
    ));

    r = color >> 16;
    g = color >> 8 & 255;
    b = color & 255;
  }

  // HSP equation from http://alienryderflex.com/hsp.html
  hsp = Math.sqrt(
    0.299 * (r * r) +
    0.587 * (g * g) +
    0.114 * (b * b)
  );

  // Using the HSP value, determine whether the color is light or dark
  if (hsp>127.5)
    return true;
  else
    return false;

}

//Copy text to clipboard
function copyTextToClipboard(text) {
   let textArea = document.createElement("textarea");
   textArea.style.position = 'fixed';
   textArea.style.top = 0;
   textArea.style.left = 0;
   textArea.style.width = '2em';
   textArea.style.height = '2em';
   textArea.style.padding = 0;
   textArea.style.border = 'none';
   textArea.style.outline = 'none';
   textArea.style.boxShadow = 'none';
   textArea.style.background = 'transparent';
   textArea.value = text;

   document.body.appendChild(textArea);

   textArea.select();

   let successful;
   try {
      successful = document.execCommand('copy');
   } catch (err) {
      successful = false;
   }

   document.body.removeChild(textArea);
   return successful;
}

//Select the Newsleter
function selectElementContents(el) {
    let body = document.body,
       range, sel;
    if (document.createRange && window.getSelection) {
       range = document.createRange();
       sel = window.getSelection();
       sel.removeAllRanges();
       range.selectNode(el);
       sel.addRange(range);

    } else if (body.createTextRange) {
       range = body.createTextRange();
       range.moveToElementText(el);
       range.select();
    }
 }

//Move items in array
function moveItem(array, from, to) {
	   // remove `from` item and store it
	   let f = array.splice(from, 1)[0];
	   // insert stored item into position `to`
	   array.splice(to, 0, f);
	   return array;
	}

//Send Error Popup
function sendError(msg,er){
  app.$snotify.error(msg);
  console.log("Error: "+er ? er : msg);
}

//Send Success Popup
function sendSuccess(msg){
  app.$snotify.success(msg);
  console.log("Success: "+msg);
}

//Send Info Popup
function sendInfo(msg){
  app.$snotify.info(msg);
  console.log("Info: "+msg);
}
