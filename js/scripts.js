let app = new Vue({
  el: '#body-wrapper',
  props:{
  },
  data: {
    sidebarHover: false,
    sidebarStuck: false,
    previewing: false,
    activeView: "setup",
    colors:{
      button: "#06874E",
      header: "#333333",
      footer: "#333333",
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
        }
      }
    },
    posts: [],
    newsletterHTML: ""
  },
  mounted() {
    if (localStorage.options){
      let options = JSON.parse(localStorage.options);
      this.$refs.loadPosts.value = options.loadPosts;
      this.$refs.loadPost.value = options.loadPost;
      if(options.header)
        this.header = options.header;
      if(options.footer)
        this.footer = options.footer;
      if(options.colors)
        this.colors = options.colors;
      if(options.analytics)
        this.analytics = options.analytics;
    }
  },
  computed: {
    analyticsEnabled: function(){
      return this.analytics.code && this.analytics.name;
    }
  },
  methods: {
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
        analytics: this.analytics
      }));
    },
    loadPosts(){
      if (localStorage.posts){
        sendSuccess("Posts Loaded");
        this.posts = JSON.parse(localStorage.posts);
      }
    },
    loadOptions(){
      if (localStorage.options){
        sendSuccess("Options Loaded");
        let options = JSON.parse(localStorage.options);
        this.$refs.loadPosts.value = options.loadPosts;
        this.$refs.loadPost.value = options.loadPost;
        if(options.header)
          this.header = options.header;
        if(options.footer)
          this.footer = options.footer;
        if(options.colors)
          this.colors = options.colors;
        if(options.analytics)
          this.analytics = options.analytics;
      }
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

     	   //For every blog found get the values and create a blog item
     	   items.forEach((item) => {

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
     	   });
         sendSuccess("Loaded Posts");
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
         })
         .catch(error => sendError("Unable to load URL", error));
      }
    },
    deletePost(pos){
      sendSuccess("Deleted Post");
      this.posts.splice(pos,1);
    },
    movePost(dir, pos){
      sendSuccess("Moved Post");
      moveItem(this.posts, pos, pos+dir);
    },
    editPost(pos, key, value){
      this.posts[pos][key] = value;
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
      sendSuccess("Copied Newsletter");
    },
    copyNewsletterCode(){
      if(copyTextToClipboard(this.$refs.newsletter.outerHTML))
        sendSuccess("Copied HTML Code");
    }
  },
  updated(){
    this.newsletterHTML = this.$refs.newsletter.outerHTML;
  }
});
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
//Select the contents
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
function moveItem(array, from, to) {
	   // remove `from` item and store it
	   let f = array.splice(from, 1)[0];
	   // insert stored item into position `to`
	   array.splice(to, 0, f);
	   return array;
	}
function sendError(msg,er){
  app.$snotify.error(msg);
  console.log("Error: "+er ? er : msg);
}
function sendSuccess(msg){
  app.$snotify.success(msg);
  console.log("Success: "+msg);
}
function sendInfo(msg){
  app.$snotify.info(msg);
  console.log("Info: "+msg);
}
/*
	//Load the individual blog post from a link function
	async function loadPostFromLink(link, callback) {
		let i = 0;
	   try {
	      let post = {};
	      //Get the results of the blog page
	      let res = await fetch(link);
	      res = await res.text();
	      let doc = (new DOMParser()).parseFromString(res, "text/html");

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
	      post.link = link;
	      post.date = doc.querySelector(".post").querySelector(".post-meta").querySelector("time").innerHTML;

	      //Check for a thumbnail
	      if (doc.querySelector(".post").querySelector(".post-thumbnail"))
	         post.img = doc.querySelector(".post").querySelector(".post-thumbnail").querySelector("img").src;

	      callback(post);
	   } catch (e) {
	      callback(null);
	   }
	}

	//Read all the blog posts from the feed XML function
	async function getFeedItems(url) {

	   //Get the results of the feed XML url
	   let res = await fetch(url);
	   res = await res.text();
	   let doc = (new DOMParser()).parseFromString(res, "text/xml");

	   //Search through the XML for the nodes
	   let channels = doc.querySelector("channel");
	   let items = channels.querySelectorAll("item");
	   let posts = [];

	   //For every blog found get the values and create a blog item
	   items.forEach((item, i) => {
	      i++;

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
	      posts.push(post);
	   });
	   return posts;


	}
 //Get description function
	async function getAllDesc(posts) {
	   let count = 0;

	   //Get the description if the post doesn't already come with one
	   for (let i = 0; i < posts.length; i++) {
	      if (posts[i].desc == null)
	         posts[i].desc = await getDesc(posts[i].link);

	      count += 1;

	      //Callback once all posts have been looked at
	      if (count == posts.length)
	         return posts;
	   }

	   //Get the description from a blog page function
	   async function getDesc(link) {

	      //Get the results of the blog page
	      let res = await fetch(link);
	      res = await res.text();
	      let descDoc = (new DOMParser()).parseFromString(res, "text/html");

	      //Get the first 20 words of the first paragraph
				let pTags = descDoc.querySelector(".post-content").querySelectorAll("p");
				let p = pTags[0];
				let i = 1;
				while(p.textContent == null || p.textContent.length == 0){
					if(i + 1 > pTags.length){
						p = pTags[0];
						break;
					}
					p = pTags[i++];
				}
	      let words = p.textContent.split(" ");
	      words = words.slice(0, Math.min(words.length, 30)).join(" ");
	      if (words && words[words.length - 1].match(/\W/g)) {
	         words = words.substr(0, words.length - 1);
	      }

	      //Add some nice ... formatting if the words were found
	      if (words)
	         words += "...";

	      return words;
	   }
	}
*/
