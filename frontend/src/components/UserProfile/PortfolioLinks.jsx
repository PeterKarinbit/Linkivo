import React, { useState } from "react";
import { userService } from "../../services/userService";

function isValidUrl(maybeUrl) {
  try {
    const u = new URL(maybeUrl);
    return u.protocol === 'http:' || u.protocol === 'https:';
  } catch (_) {
    return false;
  }
}

export default function PortfolioLinks() {
  const [inputUrl, setInputUrl] = useState("");
  const [links, setLinks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleAdd = async (e) => {
    e.preventDefault();
    setError(null);
    if (!isValidUrl(inputUrl)) {
      setError("Enter a valid http(s) URL");
      return;
    }
    setLoading(true);
    try {
      const resp = await userService.fetchLinkPreview(inputUrl);
      if (resp?.success && resp?.preview) {
        setLinks((prev) => [{ url: inputUrl, preview: resp.preview }, ...prev]);
        setInputUrl("");
      } else {
        setError(resp?.message || "Could not fetch preview");
      }
    } catch (err) {
      setError(err?.response?.data?.message || err.message || "Failed to fetch preview");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h3 className="text-xl font-semibold mb-3">Portfolio Links</h3>
      <form onSubmit={handleAdd} className="flex gap-2 mb-4">
        <input
          type="url"
          placeholder="https://your-portfolio.com or GitHub/Behance/LinkedIn URL"
          className="flex-1 border rounded-lg px-3 py-2 dark:bg-gray-700 dark:border-gray-600"
          value={inputUrl}
          onChange={(e) => setInputUrl(e.target.value)}
          required
        />
        <button
          type="submit"
          className="bg-green-600 hover:bg-green-700 text-white rounded-lg px-4 py-2 disabled:opacity-60"
          disabled={loading}
        >
          {loading ? 'Adding…' : 'Add'}
        </button>
      </form>
      {error && <div className="text-red-600 mb-3">{error}</div>}

      <div className="grid md:grid-cols-2 gap-4">
        {links.map(({ url, preview }, idx) => (
          <a key={idx} href={url} target="_blank" rel="noreferrer" className="block border rounded-xl overflow-hidden dark:border-gray-700 hover:shadow-lg transition">
            {preview.image && (
              <div className="w-full h-40 bg-gray-100 dark:bg-gray-800 overflow-hidden">
                <img src={preview.image} alt={preview.title || url} className="w-full h-full object-cover" />
              </div>
            )}
            <div className="p-4">
              <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300 mb-1">
                {preview.favicon && <img src={preview.favicon} alt="" className="w-4 h-4" />}
                <span>{preview.siteName || new URL(url).hostname}</span>
              </div>
              <div className="font-medium text-gray-900 dark:text-gray-100 line-clamp-1">{preview.title || url}</div>
              {preview.description && (
                <div className="text-sm text-gray-700 dark:text-gray-300 line-clamp-2">{preview.description}</div>
              )}
            </div>
          </a>
        ))}
        {links.length === 0 && (
          <div className="text-gray-600 dark:text-gray-300">No links added yet.</div>
        )}
      </div>
    </div>
  );
}


