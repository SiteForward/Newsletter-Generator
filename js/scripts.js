let siteForwardNewsletterTemplate = ''

let tinyMCE_settings = {
  selector: ".editable",
  menubar: false,
  inline: true,
  nowrap : true,
  skin: window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "oxide-dark"
    : "oxide",
  plugins: [
    "link",
    "autolink",
    "code",
    "codesample",
    "lists",
    "paste",
    "image",
    "help",
  ],
  default_link_target: "_blank",
  link_default_protocol: "https",
  paste_as_text: true,
  contextmenu: false,
  toolbar: [
    "blocks fontsize | bold italic underline | align lineheight |  removeformat ",
    "forecolor backcolor | numlist  bullist | superscript subscript | link image | undo redo | code",
  ],
  block_formats:
    "Paragraph=p;Heading 1=h1;Heading 2=h2;Heading 3=h3;Heading 4=h4;",
  fontsize_formats: "8pt 10pt 12pt 14pt 18pt 24pt 36pt 48pt",
  setup: function (editor) {
    editor.on("BeforeAddUndo", function (e) {
      document.querySelector("#" + editor.id).dispatchEvent(new Event("input"));
    });
  },
};

Vue.component("editable", {
  template: '<div class="editable" @input="updateInput"></div>',
  props: ["value"],
  methods: {
    updateInput(e) {
      if (tinymce.get(this.$el.id) != null)
        this.$emit("input", tinymce.get(this.$el.id).getContent());
    },
  },
  mounted() {
    let el = this.$el;
    el.innerHTML = typeof this.value == "undefined" ? "" : this.value;
    let tinyMCE_settings_clone = Object.assign({}, tinyMCE_settings);
    tinyMCE_settings_clone.selector = "#" + el.id;
    let mouseover = el.addEventListener("mouseover", function(){
      if (tinymce.get(el.id) == null){
        tinymce.init(tinyMCE_settings_clone)
      }
      e.removeEventListener(mouseover)
    })
  },
});

//Create Popup component
Vue.component("popup", {
  template:
    '<div class="popup"><i class="fas fa-cog tool-icon" title="Open Post Settings"></i><div class="popup-outerWrapper"><div class="card popup-wrapper"><h3 class="card-title">{{title}}</h3><span title="Close Popup" class="card-title-icon popup-close"><i class="far fa-window-close tool-icon"></i></span><div class="popup-content"><slot></slot></div></div></div></div>',
  props: ["title"],
  data: function () {
    return {
      isOpen: false,
    };
  },
  mounted() {
    let el = this.$el;
    el.querySelector("i").addEventListener("click", function (event) {
      el.classList.add("open");
    });
    el.querySelectorAll(".popup-outerWrapper, .popup-close i").forEach(
      (item) => {
        item.addEventListener("click", function (event) {
          if (event.target == item) el.classList.remove("open");
        });
      }
    );
  },
});

// Create Slider component
Vue.component("slider", {
  template:
    '<div class="slider-wrapper"><label :for="id"><slot></slot>:<input :id="id" type="number" :max="max" :min="min" class="compact hideSpin hideBorder" :value="val" @input="adjust"></label><div><input aria-label="id" :value="val" :max="max" :min="min" type="range" @input="adjust" required></div></div>',
  props: ["max", "min", "value", "id"],
  data: function () {
    return {
      val: 0,
    };
  },
  mounted() {
    if (this.value) this.adjust(null, this.value);
  },
  methods: {
    adjust(e, value) {
      //Update the value label based on the input slider
      this.val = value != null ? value : e.target.value ? e.target.value : 0;
      this.$el.children[1].children[0].value = this.val;

      //Emit input event to trigger v-model
      this.$emit("input", this.val);
    },
  },
});

// Create searchbar component
Vue.component("searchbar", {
  template:
    '<div><input :id="id" type="search" @input="search" required title=" "><label :for="id"><slot></slot></label></div>',
  props: ["element"],
  data: function () {
    return {
      id: null,
      defaultHTML: null,
      filter: true,
      highlight: true,
    };
  },
  mounted() {
    this.defaultHTML = this.container.innerHTML;
    this.id = this._uid;
  },
  computed: {
    container: function () {
      return document.querySelector("#" + this.element);
    },
  },
  methods: {
    search(e) {
      let search = e.target.value.trim();
      let regex = new RegExp("(" + search + ")", "ig");
      this.container.innerHTML = this.defaultHTML;

      //Hightlight
      if (this.highlight) {
        if (search && search.length > 2) {
          //Get all final child nodes that match search
          let childNodes = [];
          allDescendants(this.container);

          function allDescendants(node) {
            for (var i = 0; i < node.childNodes.length; i++) {
              var child = node.childNodes[i];
              allDescendants(child);
              if (
                child.childNodes.length == 0 &&
                child.nodeName == "#text" &&
                child.textContent.match(regex)
              )
                childNodes.push(child);
            }
          }
          //Surround child node in hightlight node
          for (let i = 0; i < childNodes.length; i++) {
            let child = childNodes[i];
            let span = document.createElement("span");
            span.innerHTML = child.data.replace(regex, "<mark>$1</mark>");

            child.parentNode.insertBefore(span, child);
            child.parentNode.removeChild(child);
          }
        }
      }

      //Filter
      if (this.filter) {
        if (search && search.length > 2) {
          //Show only the child nodes that match the search
          for (let i = 0; i < this.container.children.length; i++) {
            let child = this.container.children[i];
            if (child.textContent.match(regex)) child.style.display = "block";
            else {
              child.style.display = "none";
            }
          }
        }

        //Display all child nodes if not enough search provided
        else {
          for (let i = 0; i < this.container.children.length; i++) {
            let child = this.container.children[i];
            child.style.display = "block";
          }
        }
      }
    },
  },
});

var updateResizeHandle = new Event("updateresizehandle");
Vue.component("resizehandle", {
  template: '<div class="resize-handle" @mousedown="down"></div>',
  props: ["othercontainer", "mincontainer", "minother"],

  methods: {
    down(e) {
      document.addEventListener("mousemove", this.move);
      document.addEventListener("mouseup", this.up);
      document.querySelector("body").style = "user-select: none;";
    },
    up(e) {
      document.removeEventListener("mousemove", this.move);
      document.removeEventListener("mouseup", this.up);
      document.querySelector("body").style = "";
    },
    move(e) {
      var parent = this.$el.parentNode;
      var otherContainer = document.querySelector(this.othercontainer);
      var width = parent.offsetWidth - (e.clientX - parent.offsetLeft);

      width = Math.min(window.innerWidth - this.minother, width);
      width = Math.max(this.mincontainer, width);

      this.updateWidths(width);
    },
    updateWidths(width) {
      var parent = this.$el.parentNode;
      var otherContainer = document.querySelector(this.othercontainer);

      if (
        !parent.classList.contains("closed") &&
        !parent.classList.contains("large")
      ) {
        if (!Number.isInteger(width)) width = parent.offsetWidth;

        parent.style = "width: " + width + "; transition: none";
        var sidebarWidth = app.app.sidebarStuck ? "260" : "80";
        otherContainer.style =
          "width: calc(calc(100% - " +
          sidebarWidth +
          "px) - " +
          width +
          "px); transition: none;";

        setTimeout(function () {
          parent.style = "width: " + width;
          otherContainer.style =
            "width: calc(calc(100% - " +
            sidebarWidth +
            "px) - " +
            width +
            "px);";
        }, 1);
      }
      setTimeout(function () {
        if (
          parent.classList.contains("closed") ||
          parent.classList.contains("large")
        ) {
          parent.style = "";
          otherContainer.style = "";
        }
      }, 5);
    },
  },
  mounted() {
    document.addEventListener("updateresizehandle", this.updateWidths);
  },
});

let app = new Vue({
  el: "#body-wrapper",
  props: {},
  data: {
    renderKey: 0,
    posts: [],
    newsletterHTML: "",
    app: {
      sidebarHover: false,
      sidebarStuck: false,
      wordSupport: false,
      activeView: "setup",
      silentToggle: [],
      forceRerender: false,
    },
    newsletter: {
      previewText: "",
      data: 1,
      editPostTimer: null,
      version: 1,
    },
    styles: {
      backgroundColor: "#ffffff",
      header: {
        backgroundColor: "#333333",
        textColor: "#ffffff"
      },
      post: {
        backgroundColor: "#f3f3f3",
        textColor: "#000000",
        borderRadius: 0,
        spacing: 5,
        shadow: false,
        buttonBackgroundColor: "#06874E",
        buttonTextColor: "#ffffff",
        buttonAlign: "left",
        buttonWidth: 30,
      },
      footer: {
        backgroundColor: "#333333",
        linkColor: "#06874E",
        textColor: "#ffffff",
      },
    },
    settings: {
      analytics: {
        code: null,
        name: null,
      },
      header: {
        style: 0,
        html: "",
        image: null,
        titles: {
          title: null,
          subtitle: null,
        },
      },
      footer: {
        style: 0,
        html: "",
        preset: {
          name: null,
          email: null,
          phone: null,
          website: null,
          social: {
            facebook: null,
            linkedin: null,
            twitter: null,
            instagram: null
          },
          location: {
            address: null,
            city: null,
            province: null,
            postal: null,
          },
          disclaimer: {
            insuranceOBA: null,
            dealerOBA: null,
            logo: true,
            banking: true,
            licenses: {
              iiroc: false,
              mfda: false,
              msii: false
            },
          },
        },
      },
    },
    bannerCreationTimer: null,
    banner: {
      align: "center center",
      image: null,
      title: null,
      titleSize: 30,
      subtitle: null,
      subtitleSize: 17,
      titleSpacing: 20,
      textAlign: "center",
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
      displayGrid: false,
    },
    stylesBackup: {},
  },
  computed: {
    //If analytics code and name are valid
    analyticsEnabled: function () {
      return this.settings.analytics.code && this.settings.analytics.name;
    },
  },
  watch: {
    "app.sidebarStuck": function () {
      document.dispatchEvent(updateResizeHandle);
    },
    "app.wordSupport": function () {
      if (!this.app.silentToggle.includes("app.wordSupport"))
        sendInfo(
          "Word support turned " + (this.app.wordSupport ? "on" : "off")
        );
    },

    //On view change
    "app.activeView": function () {
      let activeView = this.app.activeView,
        preview = this.$refs.preview;

      document.dispatchEvent(updateResizeHandle);

      setTimeout(function () {
        //If changed to any of the following close the preview window
        if (
          activeView == "help" ||
          activeView == "banner" ||
          activeView == "settings"
          // || activeView == "load"
        )
          preview.classList.add("closed");
        else preview.classList.remove("closed");
      }, 1);
    },
    banner: {
      handler(val) {
        this.updateCreatedBanner();
      },
      deep: true,
    },
  },
  mounted() {
    document.querySelector(".preview-body").classList.add("loaded");
    this.stylesBackup = JSON.parse(JSON.stringify(this.styles));

    var style = document.createElement("style");
    this.$refs.newsletter.prepend(style);
    
    this.$snotify.confirm("For quicker startup please choose one of the options below.", "Newsletter Design Generator", {
      titleMaxLength: 30,
      backdrop: 0.2,
      position: "centerCenter",
      buttons: [
        {
          text: "Start from Scratch",
          action: (toast) => {
            console.log("Nothing Done")
            this.$snotify.remove(toast.id);
            document.querySelector(".snotify-backdrop").remove()
          }
        },
        {
          text: "Start from our template",
          action: (toast) => {
            this.$snotify.remove(toast.id);
            document.querySelector(".snotify-backdrop").remove()
            sendInfo("Loading Template...");
            fetch("templates/Newsletter - Template 1.json")
              .then(res => res.json())
              .then(data => {
                this.loadNewsletter(data);
              })
              .catch(error => sendError("Unable to load template. ", error))
          }
        },
        {
          text: "Load your template",
          action: (toast) => {
            this.app.activeView = 'load';
            this.$snotify.remove(toast.id);
            document.querySelector(".snotify-backdrop").remove()
          }
        }
      ],
    });
    
  },
  methods: {
    //Update settings to ensure no error on load
    updateData() {
      //Update useDisclaimer
      if (typeof this.footer.preset.useDisclaimer == "undefined")
        this.$set(this.footer.preset, "useDisclaimer", true);

      //Update Post Colours
      if (typeof this.colors.posts == "undefined")
        this.$set(this.colors, "posts", {});
      if (typeof this.colors.posts.background == "undefined")
        this.$set(this.colors.posts, "background", "#f3f3f3");
      if (typeof this.colors.posts.text == "undefined")
        this.$set(this.colors.posts, "text", "#000000");

      //Update Header
      if (typeof this.header.titles == "undefined")
        this.$set(this.header, "titles", {});
      if (typeof this.header.title != "undefined") {
        this.$set(this.header.titles, "title", this.header.title);
        delete this.header.title;
      }
      if (typeof this.header.subtitle != "undefined") {
        this.$set(this.header.titles, "subtitle", this.header.subtitle);
        delete this.header.subtitle;
      }

      //Update Disclaimer
      if (typeof this.footer.preset.useDisclaimer != "undefined")
        this.$set(this.footer.preset, "disclaimer", {});
      if (typeof this.footer.preset.disclaimer.enable == "undefined")
        this.$set(this.footer.preset.disclaimer, "enable", true);
      delete this.footer.preset.useDisclaimer;

      if (typeof this.footer.preset.disclaimer.insuranceOBA == "undefined")
        this.$set(this.footer.preset.disclaimer, "insuranceOBA", null);

      if (typeof this.footer.preset.disclaimer.licenses == "undefined")
        this.$set(this.footer.preset.disclaimer, "licenses", {});

      if (typeof this.footer.preset.disclaimer.licenses.mfda == "undefined")
        this.$set(this.footer.preset.disclaimer.licenses, "mfda", false);
      if (typeof this.footer.preset.disclaimer.licenses.iiroc == "undefined")
        this.$set(this.footer.preset.disclaimer.licenses, "iiroc", false);

      if (typeof this.footer.preset.disclaimer.logo == "undefined")
        this.$set(this.footer.preset.disclaimer, "logo", true);

      if (typeof this.colors.background == "undefined")
        this.$set(this.colors, "background", "#ffffff");

      if (typeof this.header.borderColor == "undefined")
        this.$set(this.header, "borderColor", "#111111");

      if (typeof this.header.borderWidth == "undefined")
        this.$set(this.header, "borderWidth", 0);

      if (typeof this.styles.post == "undefined")
        this.$set(this.styles, "post", {});

      if (typeof this.styles.post.borderRadius == "undefined")
        this.$set(this.styles.post, "borderRadius", 0);

      if (typeof this.styles.button == "undefined")
        this.$set(this.styles, "button", {});

      if (typeof this.styles.button.align == "undefined")
        this.$set(this.styles.button, "align", "left");
      if (typeof this.styles.button.width == "undefined")
        this.$set(this.styles.button, "width", 30);
    },
    get(obj, path) {
      return path.split(".").reduce(function (o, x) {
        return typeof o == "undefined" || o === null ? o : o[x];
      }, obj);
    },

    has(obj, path) {
      return path.split(".").every(function (x) {
        if (typeof obj != "object" || obj === null || !(x in obj)) return false;
        obj = obj[x];
        return true;
      });
    },

    set(obj, path, value) {
      var schema = obj;
      var pathSplit = path.split(".");
      var pathSplitLength = pathSplit.length;

      for (var i = 0; i < pathSplitLength - 1; i++) {
        var elem = pathSplit[i];
        if (!schema[elem]) schema[elem] = {};
        schema = schema[elem];
      }
      schema[pathSplit[pathSplitLength - 1]] = value;
    },

    //Download custom tool banner
    downloadCustomBanner() {
      //Create canvas
      let canvas = document.createElement("canvas");
      let ctx = canvas.getContext("2d");
      let img = new Image();

      //When image load - draw image, get URL
      img.onload = function () {
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
        var ev = new MouseEvent("click", {});
        anch.dispatchEvent(ev);
        document.body.removeChild(div);
        document.body.removeChild(canvas);

        //Send analytics call
        gtag("event", "Tools", {
          event_category: "Custom Banner",
          event_label: url,
        });
      };

      //Enable crossOrigin - set image src
      img.setAttribute("crossOrigin", "anonymous");
      img.src = app.$refs.bannerCreatedImage.src.replace(
        "&displayGrid=true",
        ""
      );
    },

    //Update the tool banner
    updateCreatedBanner() {
      //If an image is provided
      if (this.banner.image) {
        //If currently on cooldown - reset cooldown
        if (this.bannerCreationTimer) clearTimeout(this.bannerCreationTimer);
        this.bannerCreationTimer = setTimeout(() => {
          sendInfo("Loading custom banner image");

          //Create Banner URL with settings
          let url = "https://banner.newsletter.siteforward.ca/?createNew=true";
          for (let [key, value] of Object.entries(app.banner)) {
            if (key == "color" || key == "shadowColor")
              value = value.substring(1);
            if (key == "align") {
              let aligns = value.split(" ");
              url +=
                "&horizontalAlign=" + aligns[1] + "&verticalAlign=" + aligns[0];
            } else if (value != null && value != 0 && value != false)
              url += "&" + key + "=" + value;
          }

          //Load the image from the url
          app.$refs.bannerValidWrapper.classList.add("loading");
          app.$refs.bannerCreatedImage.src = url;
          app.$refs.bannerCreatedImage.onload = function () {
            sendSuccess("Custom banner image loaded");
            app.$refs.bannerValidWrapper.style.display = "block";
            app.$refs.bannerValidWrapper.classList.remove("loading");
          };
        }, 500);
      }
    },
    //Load posts
    loadPosts(posts) {
      if ((!posts || posts.target) && localStorage.posts)
        posts = JSON.parse(localStorage.posts);

      if (!posts || posts.target) sendError("Unable to load posts");
      else {
        sendSuccess("Posts Loaded");
        this.forceRerender();
        this.posts = posts;
      }

      if (this.posts) {
        this.posts.forEach((i) => {
          if (
            i.title &&
            i.title.indexOf("<") != 0 &&
            i.title.lastIndexOf(">") != i.title.length - 1
          )
            i.title = "<h2>" + i.title + "</h2>";
          if (
            i.date &&
            i.date.indexOf("<") != 0 &&
            i.date.lastIndexOf(">") != i.date.length - 1
          )
            i.date = "<p>" + i.date + "</p>";
          if (
            i.desc &&
            i.desc.indexOf("<") != 0 &&
            i.desc.lastIndexOf(">") != i.desc.length - 1
          )
            i.desc = "<p>" + i.desc + "</p>";
        });
      }
    },

    loadNewsletter(file) {
      if ((!file || file.target) && localStorage.newsletter)
        file = JSON.parse(localStorage.newsletter);
      if (!file || file.target) sendError("Unable to load newsletter");
      else {
        if (file.options.loadPosts)
          this.$refs.loadPosts.value = file.options.loadPosts;
        if (file.options.loadPost)
          this.$refs.loadPost.value = file.options.loadPost;

        if (file.options.previewText)
          this.newsletter.previewText = file.options.previewText;

        if (file.options.analytics)
          this.settings.analytics = file.options.analytics;

        this.forceRerender();
        this.posts = file.posts;

        this.settings.header = file.header;
        this.settings.footer = file.footer;
        this.styles = file.styles;
        
        sendSuccess("Newsletter Loaded");
      }
    },

    //Save Posts and Options
    saveNewsletter(overwrite) {
      if (overwrite == null || overwrite == undefined) overwrite = false;
      if (!overwrite && localStorage.getItem("newsletter"))
        if (
          !confirm("Do you want to overwrite your currently saved newsletter?")
        ) {
          sendInfo("Didn't Save Newsletter");
          return;
        }
      localStorage.setItem("newsletter", this.newsletterAsJSON());
      sendSuccess("Newsletter Saved");
    },

    //! Doesn't work cause it can't load images
    downloadPDF() {
      // var tempDiv = document.createElement("div");
      // tempDiv.innerHTML = this.$refs.newsletter.outerHTML;
      // document.body.append(tempDiv);
      // tempDiv.querySelectorAll('img').forEach(e =>{
      //   getDataUrl(e, url => {
      //     console.log(url);
      //     e.src = url;
      //   });
      // });
      // setTimeout(function(){

      var doc = new jsPDF();
      doc.html(document.getElementById("newsletterwrapper"), {
        callback: function (doc) {
          doc.save("Newsletter - " + this.newsletter.previewText + ".pdf");
        },
      });
      // }, 5000);
    },
    newsletterAsJSON() {
      return JSON.stringify({
        version: 1,
        posts: this.posts,
        styles: this.styles,
        header: this.settings.header,
        footer: this.settings.footer,
        options: {
          previewText: this.newsletter.previewText,
          loadPosts: this.$refs.loadPosts.value,
          loadPost: this.$refs.loadPost.value,
          analytics: this.settings.analytics,
        },
      });
    },
    downloadHTML() {
      downloadInnerHtml(
        "Newsletter - " + this.newsletter.previewText + ".html",
        "newsletterwrapper",
        "text/html"
      );
    },
    //Export posts as file
    exportNewsletter() {
      exportJSONToFile(
        this.newsletterAsJSON(),
        "Newsletter - " + this.newsletter.previewText + ".json"
      );
    },

    //Import posts from file
    importNewsletter() {
      loadJSONFile((d) => this.loadNewsletter(d));
    },

    //Import posts from file
    // DEPRECATED
    importPosts() {
      loadJSONFile((d) => this.loadPosts(d));
    },

    //Import options from file
    // DEPRECATED
    importOptions() {
      loadJSONFile((d) => this.loadOptions(d));
    },
    loadTemplate() {
      sendInfo("Loading Template...");
      fetch("templates/Newsletter - Template 1.json")
        .then(res => res.json())
        .then(data => {
          this.loadNewsletter(data);
        })
        .catch(error => sendError("Unable to load template. ", error))
    },

    //Load posts from blog page url
    loadPostsFromURL() {
      var url = this.$refs.loadPosts.value;
      if (!url || url.length < 0) sendError("Invalid load Page's URL");
      else {
        sendInfo("Loading Posts");
        fetch(url + "/feed.xml")
          .then((res) => res.text())
          .then((data) => {
            let doc = new DOMParser().parseFromString(data, "application/xml");
            //Search through the XML for the nodes
            let channels = doc.querySelector("channel");
            let items = channels.querySelectorAll("item");
            let maxCount = this.$refs.loadPostsCount.value;

            //For every blog found get the values and create a blog item
            items.forEach((item, i) => {
              if (i < maxCount) {
                let post = { style: {} };
                //Remove the prefix of the node values
                let title = item.querySelector("title").innerHTML;
                let titlePrefix = "<![CDATA[";

                title = title.substr(
                  titlePrefix.length,
                  title.length - 3 - titlePrefix.length
                );
                let link = item.querySelector("link").innerHTML;
                let img = item.getElementsByTagName("media:thumbnail")[0];
                if (img) img = img.attributes[0].nodeValue;
                let desc = item.querySelector("description");
                if (desc) {
                  desc = desc.innerHTML;
                  desc = desc.substr(
                    titlePrefix.length,
                    desc.length - 3 - titlePrefix.length
                  );
                }

                //Format the date
                let date = item.querySelector("pubDate").innerHTML;
                if (date) {
                  date = date.split(" ");
                  date = date.slice(0, 4);
                  date = date.join(" ");
                }

                //Create the blog post item, and add it to the list
                post.title = "<h2>" + title + "</h2>";
                post.date = "<p>" + date + "</p>";
                post.link = link;
                post.img = img;
                post.desc = "<p>" + desc + "</p>";
                this.posts.push(post);
              }
            });

            //Inform user if posts were found
            if (items.length > 0) sendSuccess("Loaded Posts");
            else
              sendError(
                "No posts were found, make sure you're not using the RSS Feed"
              );

            //Send call to Google Analytics
            gtag("event", "Page", {
              event_category: "Loading Posts",
              event_label: url,
              event_value: maxCount,
            });
          })
          .catch((error) => sendError("Unable to load URL", error));
      }
    },

    // Load single blog post
    //TODO: Add a way to load blog post similar to how twitter would share the page, look for title, desc, and thumbnail
    loadPostFromURL() {
      var url = this.$refs.loadPost.value;
      if (!url || url.length < 0) sendError("Invalid load Page's URL");
      else {
        sendInfo("Loading Posts");
        fetch(url)
          .then((res) => res.text())
          .then((data) => {
            let post = { style: {} };
            let doc = new DOMParser().parseFromString(data, "text/html");

            //See if the description can be found
            let tags = doc.querySelector(".post-content").querySelectorAll("*");
            let p = "";
            for (let i = 0; i < tags.length; i++) {
              if (
                tags[i].nodeName == "IMG" &&
                tags[i].alt != "image" &&
                tags[i].alt != null &&
                tags[i].alt.length != 0
              ) {
                p += tags[i].alt.trim() + " ";
              } else if (
                tags[i].textContent != null &&
                tags[i].textContent.length != 0
              )
                p += tags[i].outerText.trim() + " ";
            }

            let desc = p.split(" ");
            desc = desc.slice(0, Math.min(desc.length, 30)).join(" ");
            if (desc && desc[desc.length - 1].match(/\W/g))
              desc = desc.substr(0, desc.length - 1);
            if (desc) desc += "...";
            post.desc = "<p>" + desc + "</p>";

            //Get the rest of the values as they will be found
            post.title =
              "<h2>" +
              doc.querySelector(".post").querySelector(".post-title")
                .innerHTML +
              "</h2>";
            post.link = url;
            if (
              doc.querySelector(".post").querySelector(".post-meta") &&
              doc
                .querySelector(".post")
                .querySelector(".post-meta")
                .querySelector("time")
            )
              post.date =
                "<p>" +
                doc
                  .querySelector(".post")
                  .querySelector(".post-meta")
                  .querySelector("time").innerHTML +
                "</p>";

            //Check for a thumbnail
            if (doc.querySelector(".post").querySelector(".bg"))
              post.img = doc
                .querySelector(".post")
                .querySelector(".bg")
                .style.backgroundImage.replace('url("', "")
                .replace('")', "");
            if (doc.querySelector(".post").querySelector(".post-thumbnail"))
              post.img = doc
                .querySelector(".post")
                .querySelector(".post-thumbnail")
                .querySelector("img").src;

            this.posts.push(post);

            sendSuccess("Loaded Posts");

            //Send google analytics call
            gtag("event", "Post", {
              event_category: "Loading Posts",
              event_label: url,
            });
          })
          .catch((error) => sendError("Unable to load URL", error));
      }
    },

    //Search a url for analytics code
    findAnalyticsCode() {
      sendInfo("Searching for Google Analytics Code");
      let websiteURL = this.$refs.analyticsWebURL.value;
      if (websiteURL.indexOf("http") != 0) websiteURL = "https://" + websiteURL;
      fetch(websiteURL)
        .then((res) => res.text())
        .then((data) => {
          //Look for analytics code
          let analyticsCode = data.match(/UA-\w*-1/g);
          this.settings.analytics.code = analyticsCode;

          if (analyticsCode != null)
            sendSuccess("Found Analytics Code: " + analyticsCode);
          else sendError("Unable to find Google Analytics Code");
        })
        .catch((error) =>
          sendError("Unable to find Google Analytics Code", error)
        );
    },

    forceRerender() {
      tinymce.remove()
      this.app.forceRerender = !this.app.forceRerender;
    },

    // Delete post
    deletePost(pos) {
      this.posts.splice(pos, 1);
      sendSuccess("Deleted Post");
      this.forceRerender();
    },

    // Delete post
    duplicatePost(pos) {
      let post = this.posts[pos];
      this.posts.splice(pos, 0, JSON.parse(JSON.stringify(post)));
      sendSuccess("Duplicated Post");
      this.forceRerender();
    },
    //Move post
    movePost(dir, pos) {
      moveItem(this.posts, pos, dir);
      sendSuccess("Moved Post");
      this.forceRerender();
    },
    getPostStyle(pos, key) {
      if (this.has(this.posts[pos].style, key))
        return this.get(this.posts[pos].style, key);
      else return this.get(this.styles.post, key);
    },

    //Edit post
    editPost(pos, key, value) {
      let updateNotRender = this.has(this.posts[pos], key);

      // If currently on cooldown - reset cooldown
      if (this.newsletter.editPostTimer)
        clearTimeout(this.newsletter.editPostTimer);
      this.newsletter.editPostTimer = setTimeout(() => {
        this.set(this.posts[pos], key, value);

        this.forceRerender();
      }, 250);
    },

    //Add a new post
    addPost() {
      this.posts.push({
        title: "<h2>Post Title</h2>",
        desc: "<p>Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.</p>",
        date: "",
        style: {},
      });
      sendSuccess("Added New Post");
      //this.forceRerender();
    },

    //Copy newsletter from preview
    copyNewsletter() {
      selectElementContents(this.$refs.newsletter);
      document.execCommand("copy");
      if (window.getSelection) window.getSelection().removeAllRanges();
      sendSuccess("Copied Newsletter");
    },

    //Copy newsletter code from preview
    copyNewsletterCode() {
      if (copyTextToClipboard(this.$refs.newsletter.outerHTML))
        sendSuccess("Copied HTML Code");
    },

    copyNewsletterWord() {
      this.app.silentToggle.push("app.wordSupport");
      if (!this.wordSupport) {
        this.wordSupport = true;
        setTimeout(function () {
          this.copyNewsletter();
          setTimeout(function () {
            app.wordSupport = false;
            setTimeout(function () {
              app.app.silentToggle.splice(
                app.app.silentToggle.indexOf("app.wordSupport"),
                1
              );
            }, 1);
          }, 1);
        }, 1);
      }
    },
    resetStyles() {
      this.styles = JSON.parse(JSON.stringify(this.stylesBackup));

      this.posts.forEach((i) => {
        delete i.styles;
      });

      sendSuccess("Styling has been reset");
    },

    //Check if color is a light colour
    isLight(pos, value) {
      let res = isLightColor(this.posts[pos][value]);
      return res;
    },
    //Check if color is a light colour
    isLight(color) {
      let res = isLightColor(color);
      return res;
    },

    //Scroll to top of view
    scrollToTop() {
      this.$refs.main.scrollTop = 0;
    },

    //Add footer template HTML into custom footer
    importFooterTemplateIntoCustom() {
      setTimeout(()=>{
        app.settings.footer.style = 1
        console.log("setting footer style to "+this.settings.footer.style)
        
      setTimeout(()=>{
        console.log(app.$refs.newsletter.querySelector(".newsletter-footer").outerHTML)
        app.settings.footer.html = app.$refs.newsletter.querySelector(".newsletter-footer").outerHTML
        app.settings.footer.style = '2'
        app.forceRerender();
        sendSuccess("Footer template has been imported into the custom section.")
      }, 1)
    }, 1)
    }
  },
  updated() {
    this.newsletterHTML = this.$refs.newsletter.outerHTML;
  },
});
setTimeout(()=>
  document.querySelector(".snotify-backdrop").addEventListener("click", function(e){
    app.$snotify.clear()
    e.target.remove()
  }), 1
)


// Load JSON File
function loadJSONFile(cb) {
  var div = document.createElement("div"),
    input = document.createElement("input");
  input.type = "file";
  div.style.width = "0";
  div.style.height = "0";
  div.style.position = "fixed";
  input.accept = "application/JSON";
  document.body.appendChild(div);
  div.appendChild(input);
  var ev = new MouseEvent("click", {});
  input.dispatchEvent(ev);
  input.addEventListener("change", function (e) {
    let file = e.target.files[0];
    let reader = new FileReader();
    reader.readAsText(file);
    reader.onload = function () {
      let res = JSON.parse(reader.result);
      cb(res);
      document.body.removeChild(div);
    };
  });
}

//Export JSON File
function exportJSONToFile(obj, fileName) {
  var file = new File([obj], fileName, { type: "text/json" });
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

  var ev = new MouseEvent("click", {});
  anch.dispatchEvent(ev);
  document.body.removeChild(div);
}

// Is the color light
function isLightColor(color) {
  // Check the format of the color, HEX or RGB?
  if (!color) return false;

  if (color.match(/^rgb/)) {
    // If HEX --> store the red, green, blue values in separate variables
    color = color.match(
      /^rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*(\d+(?:\.\d+)?))?\)$/
    );

    r = color[1];
    g = color[2];
    b = color[3];
  } else {
    // If RGB --> Convert it to HEX: http://gist.github.com/983661
    color = +("0x" + color.slice(1).replace(color.length < 5 && /./g, "$&$&"));

    r = color >> 16;
    g = (color >> 8) & 255;
    b = color & 255;
  }

  // HSP equation from http://alienryderflex.com/hsp.html
  hsp = Math.sqrt(0.299 * (r * r) + 0.587 * (g * g) + 0.114 * (b * b));

  // Using the HSP value, determine whether the color is light or dark
  if (hsp > 127.5) return true;
  else return false;
}

//Copy text to clipboard
function copyTextToClipboard(text) {
  let textArea = document.createElement("textarea");
  textArea.style.position = "fixed";
  textArea.style.top = 0;
  textArea.style.left = 0;
  textArea.style.width = "2em";
  textArea.style.height = "2em";
  textArea.style.padding = 0;
  textArea.style.border = "none";
  textArea.style.outline = "none";
  textArea.style.boxShadow = "none";
  textArea.style.background = "transparent";
  textArea.value = text;

  document.body.appendChild(textArea);

  textArea.select();

  let successful;
  try {
    successful = document.execCommand("copy");
  } catch (err) {
    successful = false;
  }

  document.body.removeChild(textArea);
  return successful;
}

//Select the Newsleter
function selectElementContents(el) {
  let body = document.body,
    range,
    sel;
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
function sendError(msg, er) {
  app.$snotify.error(msg);
  console.log("Error: " + er ? er : msg);
}

//Send Success Popup
function sendSuccess(msg) {
  app.$snotify.success(msg);
  console.log("Success: " + msg);
}

//Delay function
function delay(fn, ms) {
  let timer = 0;
  return function (...args) {
    clearTimeout(timer);
    timer = setTimeout(fn.bind(this, ...args), ms || 0);
  };
}

//Send Info Popup
function sendInfo(msg) {
  app.$snotify.info(msg);
  console.log("Info: " + msg);
}

//Add Splice to strings
if (!String.prototype.splice) {
  String.prototype.splice = function (start, delCount, newSubStr) {
    return (
      this.slice(0, start) + newSubStr + this.slice(start + Math.abs(delCount))
    );
  };
}

function getDataUrl(e, cb) {
  let canvas = document.createElement("canvas");
  let ctx = canvas.getContext("2d");
  let img = new Image();

  img.onload = function () {
    canvas.width = img.width;
    canvas.height = img.height;
    ctx.drawImage(img, 0, 0);
    cb(canvas.toDataURL());
  };

  img.setAttribute("crossOrigin", "Anonymous");
  img.src = "https://cors-anywhere.herokuapp.com/" + e.src;
}

function downloadInnerHtml(filename, elId, mimeType) {
  var elHtml = document.getElementById(elId).innerHTML;
  var link = document.createElement("a");
  mimeType = mimeType || "text/plain";

  link.setAttribute("download", filename);
  link.setAttribute(
    "href",
    "data:" + mimeType + ";charset=utf-8," + encodeURIComponent(elHtml)
  );
  link.click();
}
