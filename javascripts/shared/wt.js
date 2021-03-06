$ = require("jquery");
_ = require("underscore");

WT = {
  path: document.location.pathname.split("/").pop(),
  projectPath: "https://en.wikipedia.org",

  api: function(endpoint, params, noPath) {
    if(typeof params === "object") {
      params = _.extend(params, { norecord: true });
    } else {
      params = (params + "&norecord=1").replace(/^&/, '');
    }

    return $.ajax({
      url: "/musikanimal/api" + (noPath ? '' : '/' + WT.path) + (endpoint ? "/" + endpoint : ""),
      method: "GET",
      data: params,
      dataType: "JSON"
    });
  },

  replag: function(replag) {
    if(!replag) return;

    var minutes = Math.round(replag / 60);

    if(minutes >= 60) {
      var hours = Math.floor(minutes / 60),
        leftover = minutes % 60;
      return hours + " hour" + (hours > 1 ? "s" : "") +
        (leftover > 0 ? " and " + leftover + " minute" + (leftover > 1 ? "s" : "") : "");
    } else if(minutes > 2) {
      return minutes + " minutes";
    } else {
      return replag + " seconds";
    }
  },

  updateProgress: function(value, message) {
    if(!$("progress")[0]) return;

    if(value !== null) {
      if(value >= 100) {
        $("progress").val(100);
        $(".progress-report").text("Complete!");
      } else {
        $("progress").val(value).show();
        $(".progress-report").text(value + "%");
      }
      if(message) {
        $(".loading-text").text(message);
      }
    } else {
      $("progress").val(0).hide();
      $(".progress-report").text("");
    }
  },

  wikifyText: function(text, pageName) {
    var sectionRegex = new RegExp(/^\/\* (.*?) \*\//),
      sectionMatch = sectionRegex.exec(text);

    if(sectionMatch) {
      var sectionTitle = sectionMatch[1];
      text = text.replace(sectionMatch[0],
        "<a href='"+WT.projectPath+"/wiki/"+pageName+"#"+sectionTitle.replace(/ /g,"_")+"'>&rarr;</a><span class='gray'>"+sectionTitle+":</span> "
      );
    }

    var linkRegex = new RegExp(/\[\[(.*?)\]\]/g), linkMatch;

    while(linkMatch = linkRegex.exec(text)) {
      var wikilink = linkMatch[1].split("|")[0],
        wikitext = linkMatch[1].split("|")[1] || wikilink,
        link = "<a href='"+WT.projectPath+"/wiki/"+wikilink+"' class='section-link'>"+wikitext+"</a>";

      text = text.replace(linkMatch[0], link);
    }

    return text;
  }
};

$(document).ready(function() {
  $("a").on("click", function(e) {
    if(e.target.href === "#") e.preventDefault();
  });

  if(document.location.search.indexOf("username=") !== -1) {
    setTimeout(function() {
      $("form").trigger("submit");
    });
  }

  $(".about-link").attr("href", "/musikanimal/"+WT.path+"/about");

  $(".dropdown-text").on("click", function(e) {
    var $selector = $(this).siblings(".dropdown-options");
    if($selector.hasClass("open")) {
      return;
    }
    $selector.addClass("open");
    e.stopPropagation();

    setTimeout(function() {
      $(document).one("click.dropdown", function(e) {
        $selector.removeClass("open");
      });
    });
  });

  $(".dropdown-option").on("click", function() {
    var $options = $(this).parents(".dropdown-options");
    $("#"+$options.data("select")).val($(this).data("id"));
    $options.siblings(".dropdown-text").text($(this).text());
  });

  $("form").on("submit", function(e) {
    e.preventDefault();

    $("button").blur();
    $(".loading").show();
    $(this).addClass("busy");

    $(this).find("[type=text]").each(function() {
      this.value = this.value.trim();
    });

    this.params = $(this).serialize();

    $.ajax({
      url: "/musikanimal/api/uses",
      method: 'PATCH',
      data : {
        tool: WT.path,
        type: 'form'
      }
    });

    WT.formSubmit.call(this);
  });

  if(WT.listeners) WT.listeners();
});
