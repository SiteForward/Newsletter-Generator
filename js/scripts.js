// Create Slider component
Vue.component('slider', {
  template: '<div class="slider-wrapper"><label><slot></slot>:<input type="number" :max="max" :min="min" class="compact hideSpin hideBorder" :value="val" @input="adjust"></label><div><input :id="id" :value="val" :max="max" :min="min" type="range" @input="adjust" required></div></div>',
  props: ['max', 'min', 'value'],
  data: function() {
      return {
        id: null,
        val: 0
    }
  },
  mounted(){
    this.adjust(null, this.value);
  },
  methods:{
    adjust(e, value){

      //Update the value label based on the input slider
      this.val = value != null ? value : e.target.value;
      this.$el.children[1].children[0].value = this.val;

      //Emit input event to trigger v-model
      this.$emit('input', this.val);
    }
  }
});

// Create searchbar component
Vue.component('searchbar', {
  template: '<div><input :id="id" type="search" @input="search" required><label :for="id"><slot></slot></label></div>',
  props: ['element'],
  data: function() {
      return {
        id: null,
        defaultHTML: null,
        filter: true,
        highlight: true
    }
  },
  mounted(){
    this.defaultHTML = this.container.innerHTML;
    this.id = this._uid
  },
  computed: {
    container: function(){
      return document.querySelector("#"+this.element);
    }
  },
  methods: {
    search(e){
      let search = e.target.value.trim();
      let regex = new RegExp('('+search+')', 'ig');
      this.container.innerHTML = this.defaultHTML;

      //Hightlight
      if(this.highlight){
        if(search && search.length > 2){

          //Get all final child nodes that match search
          let childNodes = [];
          allDescendants(this.container);
          function allDescendants (node) {
            for (var i = 0; i < node.childNodes.length; i++) {
              var child = node.childNodes[i];
              allDescendants(child);
              if(child.childNodes.length == 0 && child.nodeName == "#text" && child.textContent.match(regex))
                childNodes.push(child);
            }
          }
          //Surround child node in hightlight node
          for(let i = 0; i < childNodes.length; i++){
            let child = childNodes[i];
            let span = document.createElement('span');
            span.innerHTML = child.data.replace(regex, '<span style="background-color: yellow">$1</span>');

            child.parentNode.insertBefore(span, child);
            child.parentNode.removeChild(child);
          };
        }
      }

      //Filter
      if(this.filter){
        if(search && search.length > 2){

          //Show only the child nodes that match the search
          for(let i = 0; i < this.container.children.length; i++){
            let child = this.container.children[i];
            if(child.textContent.match(regex))
               child.style.display = "block";
             else{
               child.style.display = "none";
             }
          }
        }

        //Display all child nodes if not enough search provided
        else{
          for(let i = 0; i < this.container.children.length; i++){
            let child = this.container.children[i];
            child.style.display = "block";
          }
        }
      }
    }
  }
});

Vue.component('editabletext', {
  template: '<p contentEditable="true" class="contentEditable" @input="updateInput" @keydown="customShortcuts"></p>',
  props: ['value'],
  methods: {
    updateInput(e){

      //Emit input event trigger v-model
      this.$emit('input', this.$el.innerHTML);
    },
    customShortcuts(e){

      //Key shortcuts
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
      html: null,
      image: null,
      titles: {
        title: null,
        subtitle: null
      }
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
    newsletterHTML: "",
    tools:{
      bannerCreationTimer: null,
      banner:{
        align: 'center center',
        image: null,
        title: null,
        titleSize: 30,
        subtitle: null,
        subtitleSize: 17,
        titleSpacing: 20,
        textAlign: 'center',
        color: "#000000",
        offsetY: 0,
        offsetX: 0,
        logo: null,
        logoX: 0,
        logoY: 0,
        logoWidth: 300,
        shadowColor: "#333333",
        shadowEnabled: false,
        shadowOffsetX: 1,
        shadowOffsetY: 1,
        shadowBlur: 5,
        displayGrid: false
      }
    }
  },
  computed: {

    //If analytics code and name are valid
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

    //On view change
    activeView: function(){
      let activeView = this.activeView,
          preview = this.$refs.preview;

      setTimeout(function(){
        //If changed to any of the following close the preview window
        if(activeView == "help" || activeView == "tools" || activeView == "settings" || activeView == "load")
          preview.classList.add("closed");
        else
          preview.classList.remove("closed");
      }, 1);
    },
    'tools.banner': {
      handler(val){
         this.updateCreatedBanner();
     },
     deep: true
    }
  },
  mounted(){

    //Prompt to load local options if exists
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

      //Prompt to load local posts if exists
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

    //Download custom tool banner
    downloadCustomBanner(){

      //Create canvas
      let canvas = document.createElement("canvas");
      let ctx = canvas.getContext("2d");
      let img = new Image();

      //When image load - draw image, get URL
      img.onload = function(){
        canvas.width = img.width;
        canvas.height = img.height;
        ctx.drawImage(img, 0, 0);
        let url = canvas.toDataURL();

        //Create link to download image
        var div = document.createElement("div"),
    	     anch = document.createElement("a");
        document.body.appendChild(div);
      	div.appendChild(anch);

      	anch.innerHTML = "&nbsp;";
      	div.style.width = "0";
      	div.style.height = "0";
      	anch.href = url;
      	anch.download = "Custom-Banner.png";

        //Trigger click event on link
      	var ev = new MouseEvent("click",{});
      	anch.dispatchEvent(ev);
      	document.body.removeChild(div);

        //Send analytics call
        gtag('event', 'Tools', {
          'event_category': 'Custom Banner',
          'event_label': url,
        });
      }

      //Enable crossOrigin - set image src
      img.setAttribute('crossOrigin', 'anonymous');
      img.src =  app.$refs.bannerCreatedImage.src.replace('&displayGrid=true', '');

    },

    //Update the tool banner
    updateCreatedBanner(){

      //If an image is provided
      if(this.tools.banner.image){

        //If currently on cooldown - reset cooldown
        if(this.tools.bannerCreationTimer)
          clearTimeout(this.tools.bannerCreationTimer)
        this.tools.bannerCreationTimer = setTimeout(()=>{
          sendInfo("Loading custom banner image");

          //Create Banner URL with settings
          let url = "https://bimmr.com/newsletter/tools/createbanner.php?createNew=true";
          for(let [key, value] of Object.entries(app.tools.banner)){
            if(key == "color" || key == "shadowColor")
              value = value.substring(1);
            if(key == "align"){
              let aligns = value.split(' ')
              url+= "&horizontalAlign="+aligns[1] + "&verticalAlign="+aligns[0];
            }
            else if(value != null && value != 0 && value != false)
              url+= "&"+key+"="+value;
          }

          //Load the image from the url
          app.$refs.bannerValidWrapper.classList.add("loading");
          app.$refs.bannerCreatedImage.src = url;
          app.$refs.bannerCreatedImage.onload = function(){
            sendSuccess("Custom banner image loaded");
            app.$refs.bannerValidWrapper.style.display = "block";
            app.$refs.bannerValidWrapper.classList.remove("loading");
          }
        }, 500);
      }
    },

    //Get the default post color if no per post color exists
    postColor(pos, key){
      return typeof this.posts[pos][key] == 'undefined' ? this.colors.posts[key] : this.posts[pos][key];
    },

    //Update settings to ensure no error on load
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

      //Update Header
      if(typeof this.header.titles == 'undefined')
          this.$set(this.header, "titles", {});
      if(typeof this.header.title != 'undefined'){
        this.$set(this.header.titles, "title", this.header.title);
        delete this.header.title;
      }
      if(typeof this.header.subtitle != 'undefined'){
        this.$set(this.header.titles, "subtitle", this.header.subtitle);
        delete this.header.subtitle;
      }
    },

    //Load posts
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

    //Load options
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

    //Save posts
    savePosts(){
      if(localStorage.getItem("posts"))
        if(!confirm("Do you want to overwrite your currently saved posts?")){
          sendInfo("Didn't Save Posts");
          return;
        }
      localStorage.setItem("posts", JSON.stringify(this.posts));
      sendSuccess("Posts Saved");
    },

    //Save options
    saveOptions(){
      if(localStorage.getItem("options"))
        if(!confirm("Do you want to overwrite your currently saved options?")){
          sendInfo("Didn't Save Options");
          return;
        }

      localStorage.setItem("options", JSON.stringify({
        loadPosts: this.$refs.loadPosts.value,
        loadPost: this.$refs.loadPost.value,
        header: this.header,
        footer: this.footer,
        colors: this.colors,
        analytics: this.analytics,
        editHTML: this.editHTML
      }));
      sendSuccess("Options Saved");
    },

    //Export posts as file
    exportPosts(){
      exportJSONToFile(this.posts, "Newsleter - Posts.json");
    },

    //Export options as file
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

    //Import posts from file
    importPosts(){
      loadJSONFile(d => this.loadPosts(d));
    },

    //Import options from file
    importOptions(){
      loadJSONFile(d => this.loadOptions(d));
    },

    //Load posts from blog page url
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

         //Inform user if posts were found
         if(items.length > 0)
          sendSuccess("Loaded Posts");
         else
          sendError("No posts were found");

         //Send call to Google Analytics
         gtag('event', 'Page', {
           'event_category': 'Loading Posts',
           'event_label': url,
           'event_value': maxCount
         });
        })
        .catch(error => sendError("Unable to load URL", error));
      }
    },

    // Load single blog post
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

          //Send google analytics call
          gtag('event', 'Post', {
            'event_category': 'Loading Posts',
            'event_label': url
          });
         })
         .catch(error => sendError("Unable to load URL", error));
      }
    },

    //Search a url for analytics code
    findAnalyticsCode(){
      sendInfo("Searching for Google Analytics Code");
      let websiteURL = this.$refs.analyticsWebURL.value;
      if(websiteURL.indexOf('http') != 0)
        websiteURL = "https://"+websiteURL;
      fetch(websiteURL)
      .then(res => res.text())
      .then(data =>{

        //Look for analytics code
        let analyticsCode = data.match(/UA-\w*-1/g);
        this.analytics.code = analyticsCode;

        if(analyticsCode != null)
          sendSuccess("Found Analytics Code: " + analyticsCode);
        else
          sendError("Unable to find Google Analytics Code");
      })
      .catch(error => sendError("Unable to find Google Analytics Code", error));;
    },

    //Silently toggle HTML Edit - forces editabletext to re-render
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

    // Delete post
    deletePost(pos){
      sendSuccess("Deleted Post");
      this.posts.splice(pos, 1);
      this.toggleEditHTMLSilently();
    },

    //Move post
    movePost(dir, pos){
      sendSuccess("Moved Post");
      moveItem(this.posts, pos, dir);
      this.toggleEditHTMLSilently();
    },

    //Edit post
    editPost(pos, key, value){
      this.posts[pos][key] = value;
      this.toggleEditHTMLSilently();
    },

    //Add a new post
    addPost(){
      sendSuccess("Added New Post");
      this.posts.push({
        title: 'New Post',
        desc: 'New Desc'
      });
    },

    //Copy newsletter from preview
    copyNewsletter(){
      selectElementContents(this.$refs.newsletter);
      document.execCommand('copy');
      if (window.getSelection) window.getSelection().removeAllRanges();
      sendSuccess("Copied Newsletter");
    },

    //Copy newsletter code from preview
    copyNewsletterCode(){
      if(copyTextToClipboard(this.$refs.newsletter.outerHTML))
        sendSuccess("Copied HTML Code");
    },

    //Check if color is a light colour
    isLight(color){
      let res = isLightColor(color);
      return res;
    },

    //Scroll to top of view
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
  var json = JSON.stringify(obj);
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
   let f = array.splice(from, 1)[0];
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

//Delay function
function delay(fn, ms) {
  let timer = 0
  return function(...args) {
    clearTimeout(timer)
    timer = setTimeout(fn.bind(this, ...args), ms || 0)
  }
}

//Send Info Popup
function sendInfo(msg){
  app.$snotify.info(msg);
  console.log("Info: "+msg);
}

//Add Splice to strings
if (!String.prototype.splice) {
    String.prototype.splice = function(start, delCount, newSubStr) {
        return this.slice(0, start) + newSubStr + this.slice(start + Math.abs(delCount));
    };
}
