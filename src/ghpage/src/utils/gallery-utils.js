// Gallery and thumb extraction utilities

export function extractGalleries(html) {
  html = html.replace(
    /<ul class="gallery"[^>]*>([\s\S]*?)<\/ul>/gi,
    function (m, inner) {
      var imgs = [];
      var re = /<img\s[^>]*src="([^"]+)"[^>]*>/gi;
      var im;
      while ((im = re.exec(inner)) !== null) {
        imgs.push(
          '<img src="' +
            im[1].replace(/^\/\//, "https://") +
            '" alt="" />',
        );
      }
      return imgs.join(" ");
    },
  );
  return html;
}

export function extractThumbs(html) {
  html = html.replace(
    /<div class="(thumb|float\w+)[^"]*"[^>]*>([\s\S]*?)<\/div>/gi,
    function (m, cls, inner) {
      var imgMatch = inner.match(/<img\s[^>]*src="([^"]+)"[^>]*>/i);
      if (imgMatch) {
        var src = imgMatch[1].replace(/^\/\//, "https://");
        var capMatch = inner.match(
          /<div class="thumbcaption[^"]*"[^>]*>([\s\S]*?)<\/div>/i,
        );
        var cap = capMatch
          ? capMatch[1].replace(/<[^>]+>/g, "").trim()
          : "";
        return (
          '<figure><img src="' +
          src +
          '" alt="" />' +
          (cap ? "<figcaption>" + cap + "</figcaption>" : "") +
          "</figure>"
        );
      }
      return inner;
    },
  );
  return html;
}
