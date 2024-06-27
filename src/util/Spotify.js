const clientId = process.env.REACT_APP_SPOTIFY_CLIENT_ID;
const spotifySearchAPI = process.env.REACT_APP_SPOTIFY_SEARCH_API;
const spotifyUserProfileAPI = process.env.REACT_APP_SPOTIFY_USER_PROFILE_API;
const spotifyRedirectUrl = process.env.REACT_APP_SPOTIFY_REDIRECT_URL;

let accessToken;

const Spotify = {
  getAccessToken() {
    if (accessToken) return accessToken;

    const accessTokenMatch = window.location.href.match(/access_token=([^&]*)/);
    const expiresInMatch = window.location.href.match(/expires_in=([^&]*)/);

    if (accessTokenMatch && expiresInMatch) {
      accessToken = accessTokenMatch[1];
      const expiresIn = Number(expiresInMatch[1]);
      window.setTimeout(() => accessToken = '', expiresIn * 1000);
      window.history.pushState('Access Token', null, '/');
      return accessToken;
    } else {
      const accessUrl = `https://accounts.spotify.com/authorize?client_id=${clientId}&response_type=token&scope=playlist-modify-public&redirect_uri=${spotifyRedirectUrl}`;
      window.location = accessUrl;
    }
  },

  search(term) {
    const accessToken = Spotify.getAccessToken();
    return fetch(`${spotifySearchAPI}?type=track&q=${term}`, {
      headers: { Authorization: `Bearer ${accessToken}` }
    }).then(response => response.json()).then(jsonResponse => {
      if (!jsonResponse.tracks) return [];
      return jsonResponse.tracks.items.map(track => ({
        id: track.id,
        name: track.name,
        artist: track.artists[0].name,
        album: track.album.name,
        uri: track.uri
      }));
    });
  },

  savePlaylist(name, trackUris) {
    if (!name || !trackUris.length) return;

    const accessToken = Spotify.getAccessToken();
    const headers = { Authorization: `Bearer ${accessToken}` };
    let userId;

    return fetch(spotifyUserProfileAPI, { headers }).then(response => response.json()).then(jsonResponse => {
      userId = jsonResponse.id;
      const spotifyPlaylistAPI = `https://api.spotify.com/v1/users/${userId}/playlists`;
      return fetch(spotifyPlaylistAPI, {
        headers,
        method: 'POST',
        body: JSON.stringify({ name })
      }).then(response => response.json()).then(jsonResponse => {
        const playlistId = jsonResponse.id;
        const spotifyPlaylistTracksAPI = `https://api.spotify.com/v1/users/${userId}/playlists/${playlistId}/tracks`;
        return fetch(spotifyPlaylistTracksAPI, {
          headers,
          method: 'POST',
          body: JSON.stringify({ uris: trackUris })
        });
      });
    });
  }
};

export default Spotify;
