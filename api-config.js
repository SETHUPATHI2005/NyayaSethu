(function () {
  var KEY = "nyayasethu_api_url";
  var params = new URLSearchParams(window.location.search);
  var fromQuery = params.get("api");

  function clean(url) {
    return String(url || "").trim().replace(/\/+$/, "");
  }

  if (fromQuery) {
    localStorage.setItem(KEY, clean(fromQuery));
  }

  var configured = clean(localStorage.getItem(KEY));
  var isLocal = ["localhost", "127.0.0.1"].indexOf(window.location.hostname) !== -1;
  var fallback = isLocal ? "http://127.0.0.1:8000" : "";

  window.NYAYASETHU_API = configured || fallback;
  window.setNyayaSethuApi = function (url) {
    var normalized = clean(url);
    if (!normalized) {
      localStorage.removeItem(KEY);
      window.NYAYASETHU_API = fallback;
      return;
    }
    localStorage.setItem(KEY, normalized);
    window.NYAYASETHU_API = normalized;
  };
})();

