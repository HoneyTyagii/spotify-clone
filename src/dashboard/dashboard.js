import { fetchRequest } from "../api";
import { ENDPOINT, getItemFromLocalStorage, LOADED_TRACKS, logout, NOW_PLAYING, SECTIONTYPE, setItemInLocalStorage } from "../common";
let displayName;
const audio = new Audio();
const onProfileClick = (event) => {
    event.stopPropagation();
    const profileMenu = document.querySelector("#profile-menu");
    profileMenu.classList.toggle("hidden");
    if (!profileMenu.classList.contains("hidden")) {
        profileMenu.querySelector("li#logout").addEventListener("click", logout)
    }
}

const loadUserProfile = () => {
    return new Promise(async (resolve, reject) => {
        const defaultImage = document.querySelector("#default-image");
        const profileButton = document.querySelector("#user-profile-btn");
        const displayNameElement = document.querySelector("#display-name")

        const { display_name: displayName, images } = await fetchRequest(ENDPOINT.userInfo);

        if (images?.length) {
            defaultImage.classList.add("hidden");
        } else {
            defaultImage.classList.remove("hidden")
        }

        profileButton.addEventListener("click", onProfileClick)
        displayNameElement.textContent = displayName;
        resolve({ displayName, images });
    })
}

const onPlaylistItemClicked = (event, id) => {
    console.log(event.target);
    const section = { type: SECTIONTYPE.PLAYLIST, playlist: id }
    history.pushState(section, "", `playlist/${id}`);
    loadSection(section);
}

const loadPlaylist = async (endpoint, elementId) => {
    const { playlists: { items } } = await fetchRequest(endpoint);
    const playlistItemsSection = document.querySelector(`#${elementId}`);

    for (let { name, description, images, id } of items) {
        const playlistItem = document.createElement("section");
        playlistItem.className = "bg-black-secondary rounded p-4 hover:cursor-pointer hover:bg-light-black";
        playlistItem.id = id;
        playlistItem.setAttribute("data-type", "playlist");
        playlistItem.addEventListener("click", (event) => onPlaylistItemClicked(event, id));
        const [{ url: imageUrl }] = images;
        playlistItem.innerHTML = `<img src="${imageUrl}" alt="${name}" class="rounded mb-2 object-contain shadow" />
            <h2 class="text-base font-semibold mb-4 truncate">${name}</h2>
            <h3 class="text-sm text-secondary line-clamp-2">${description}</h3>`;

        playlistItemsSection.appendChild(playlistItem);
    }
}

const loadPlaylists = () => {
    loadPlaylist(ENDPOINT.featuredPlayist, "featured-playlist-items");
    loadPlaylist(ENDPOINT.toplists, "top-playlist-items");
}

const fillContentForDashboard = () => {
    const coverElement = document.querySelector("#cover-content");
    coverElement.innerHTML = `<h1 class="text-8xl">Hello ${displayName}</h1>`;
    const pageContent = document.querySelector("#page-content");
    const playlistMap = new Map([["featured", "featured-playlist-items"], ["top playlists", "top-playlist-items"]]);
    let innerHTML = "";
    for (let [type, id] of playlistMap) {
      innerHTML += `
      <article class="p-4">
        <h1 class="mb-4 text-2xl font-bold capitalize">${type}</h1>
        <section id="${id}" class="featured-songs"> <!-- Removed the grid and gap classes -->
         
        </section>
      </article>
      `
    }
    pageContent.innerHTML = innerHTML;
  }


const formatTime = (duration) => {
    const min = Math.floor(duration / 60_000);
    const sec = ((duration % 6_000) / 1000).toFixed(0);
    const formattedTime = sec == 60 ?
        min + 1 + ":00" : min + ":" + (sec < 10 ? "0" : "") + sec;
    return formattedTime;

}

const onTrackSelection = (id, event) => {
    document.querySelectorAll("#tracks .track").forEach(trackItem => {
        if (trackItem.id === id) {
            trackItem.classList.add("bg-gray", "selected");
        } else {
            trackItem.classList.remove("bg-gray", "selected");
        }
    })
}

const onAudioMetadataLoaded = () => {
    const totalSongDuration = document.querySelector("#total-song-duration");
    totalSongDuration.textContent = `0:${audio.duration.toFixed(0)}`;
}

const updateIconsForPauseMode = (id) => {
    const playButton = document.querySelector("#play");

    playButton.querySelector("span").textContent = "play_circle";
    const playButtonFromTracks = document.querySelector(`#play-track-${id}`);
    if (playButtonFromTracks) {
        playButtonFromTracks.textContent = "play_arrow";
    }
}

const updateIconsForPlayMode = (id) => {
    const playButton = document.querySelector("#play");

    playButton.querySelector("span").textContent = "pause_circle";
    const playButtonFromTracks = document.querySelector(`#play-track-${id}`);
    if (playButtonFromTracks) {
        playButtonFromTracks.textContent = "pause";
    }
}

const playTrack = (event, { image, artistNames, name, duration, previewUrl, id }) => {
    if (event?.stopPropagation) {
        event.stopPropagation();
    }
    console.log(image, artistNames, name, duration, previewUrl, id);
    if (audio.src === previewUrl) {
        togglePlay();
    } else {

        setNowPlayingInfo({ image, id, name, artistNames });
        audio.src = previewUrl;
        audio.play();
    }
}

const setNowPlayingInfo = ({ image, id, name, artistNames }) => {
    const audioControl = document.querySelector("#audio-control");
    const songTitle = document.querySelector("#now-playing-song");
    const nowPlayingSongImage = document.querySelector("#now-playing-image");
    const artists = document.querySelector("#now-playing-artists");
    const songInfo = document.querySelector("#song-info");

    nowPlayingSongImage.src = image.url;
    audioControl.setAttribute("data-track-id", id);
    songTitle.textContent = name;
    artists.textContent = artistNames;
    songInfo.classList.remove("invisible");
}

const loadPlaylistTracks = ({ tracks }) => {
    const trackSections = document.querySelector("#tracks");
    let trackNo = 1;
    const loadedTracks = [];
    for (let trackItem of tracks.items.filter(item => item.track.preview_url)) {
        let { id, artists, name, album, duration_ms: duration, preview_url: previewUrl } = trackItem.track;
        let track = document.createElement("section");
        track.id = id;
        track.className = "track p-1 grid grid-cols-[50px_1fr_1fr_50px] items-center justify-items-start gap-4 rounded-md hover:bg-light-black";
        let image = album.images.find(img => img.height === 64);
        let artistNames = Array.from(artists, artist => artist.name).join(", ");
        track.innerHTML = `
        <p class="relative w-full flex items-center justify-center justify-self-center"><span class="track-no">${trackNo++}</span></p>
              <section class="grid grid-cols-[auto_1fr] place-items-center gap-2">
                <img class="h-10 w-10" src="${image.url}" alt="${name}" />
                <article class="flex flex-col gap-2 justify-center">
                  <h2 class="text-base text-primary line-clamp-1 song-title">${name}</h2>
                  <p class="text-xs line-clamp-1">${artistNames}</p>
                </article>
              </section>
              <p class="text-sm">${album.name}</p>
              <p class="text-sm">${formatTime(duration)}</p>
        `;
        track.addEventListener("click", (event) => onTrackSelection(id, event));

        const playButton = document.createElement("button");
        playButton.id = `play-track-${id}`;
        playButton.className = `play w-full absolute left-0 text-lg invisible material-symbols-outlined`;
        playButton.textContent = "play_arrow";
        playButton.addEventListener("click", (event) => playTrack(event, { image, artistNames, name, duration, previewUrl, id }))
        track.querySelector("p").appendChild(playButton);
        trackSections.appendChild(track);

        loadedTracks.push({ id, artists, name, album, duration, previewUrl, artistNames, image })
    }

    setItemInLocalStorage(LOADED_TRACKS, loadedTracks);

}

const fillContentForPlaylist = async (playlistId) => {
    const playlist = await fetchRequest(`${ENDPOINT.playlist}/${playlistId}`)
    console.log(playlist);
    const { name, description, images, tracks } = playlist;
    const coverElement = document.querySelector("#cover-content");
    coverElement.innerHTML = `
        <img  class="object-contain" src="${images[0].url}" alt="${name}" />
        <section class="flex flex-col justify-center">
          <h2 id="playlist-name" class="text-8xl font-bold">${name}</h2>
          <p id="playlist-details" class="text-2xl">${description} songs</p>
          <p id="playlist-details" class="text-base">${tracks.items.length} songs</p>
        </section>
    `
    const pageContent = document.querySelector("#page-content");
    pageContent.innerHTML = `
    <header id="playlist-header" class="mx-8 border-secondary border-b-[0.5px] z-10">
            <nav class="py-2">
              <ul class="grid grid-cols-[50px_1fr_1fr_50px] gap-4 text-secondary">
                <li class="justify-self-center">#</li>
                <li>Title</li>
                <li>Album</li>
                <li class="material-symbols-outlined">schedule</li>
              </ul>
            </nav>
    </header>
    <section class="px-8 text-secondary mt-4" id="tracks">
    </section>
    `



    console.log(playlist);
    loadPlaylistTracks(playlist)

}

const onContentScroll = (event) => {

    const { scrollTop } = event.target;
    const header = document.querySelector(".header");
    const coverElement = document.querySelector("#cover-content");
    const totalHeight = coverElement.offsetHeight;
    const fiftyPercentHeight = totalHeight / 2;
    const coverOpacity = 100 - (scrollTop >= totalHeight ? 100 : (scrollTop / totalHeight) * 100);
    coverElement.style.opacity = `${coverOpacity}%`;

    let headerOpacity = 0;
    if (scrollTop >= fiftyPercentHeight && scrollTop <= totalHeight) {
        let totatDistance = totalHeight - fiftyPercentHeight;
        let coveredDistance = scrollTop - fiftyPercentHeight;
        headerOpacity = (coveredDistance / totatDistance) * 100;
    } else if (scrollTop > totalHeight) {
        headerOpacity = 100;
    } else if (scrollTop < fiftyPercentHeight) {
        headerOpacity = 0;
    }
    header.style.background = `rgba(0 0 0 / ${headerOpacity}%)`

    if (history.state.type === SECTIONTYPE.PLAYLIST) {
        const playlistHeader = document.querySelector("#playlist-header");
        if (headerOpacity >= 60) {
            playlistHeader.classList.add("sticky", "bg-black-secondary", "px-8");
            playlistHeader.classList.remove("mx-8");
            playlistHeader.style.top = `${header.offsetHeight}px`;

        } else {
            playlistHeader.classList.remove("sticky", "bg-black-secondary", "px-8");
            playlistHeader.classList.add("mx-8");
            playlistHeader.style.top = `revert`;

        }

    }

}
const togglePlay = () => {
    if (audio.src) {
        if (audio.paused) {
            audio.play();
        } else {
            audio.pause();
        }
    }
}

const findCurrentTrack = () => {
    const audioControl = document.querySelector("#audio-control");
    const trackId = audioControl.getAttribute("data-track-id");
    if (trackId) {
        const loadedTracks = getItemFromLocalStorage(LOADED_TRACKS);
        const currentTrackIndex = loadedTracks?.findIndex(track => track.id === trackId);
        return { currentTrackIndex, tracks: loadedTracks };


    }
    return null;
}

const playPrevTrack = () => {
    const { currentTrackIndex = -1, tracks = null } = findCurrentTrack() ?? {};
    if (currentTrackIndex > 0) {
        const prevTrack = tracks[currentTrackIndex - 1];
        playTrack(null, prevTrack);
    }
}

const playNextTrack = () => {
    const { currentTrackIndex = -1, tracks = null } = findCurrentTrack() ?? {};
    if (currentTrackIndex > -1 && currentTrackIndex < tracks?.length - 1) {
        const currentTrack = tracks[currentTrackIndex + 1];
        playTrack(null, currentTrack);
    }
}

const loadSection = (section) => {
    if (section.type === SECTIONTYPE.DASHBOARD) {
        fillContentForDashboard();
        loadPlaylists();
    } else if (section.type === SECTIONTYPE.PLAYLIST) {
        //load the elements for playlist
        fillContentForPlaylist(section.playlist);
    }

    document.querySelector(".content").removeEventListener("scroll", onContentScroll);
    document.querySelector(".content").addEventListener("scroll", onContentScroll);
}
const onUserPlaylistClick = (id) => {
    const section = { type: SECTIONTYPE.PLAYLIST, playlist: id };
    history.pushState(section, "", `/playlist/${id}`);
    loadSection(section);
}
const loadUserPlaylist = async () => {
    const playlists = await fetchRequest(ENDPOINT.userPlaylist);
    console.log(playlists);
    const userPlaylist = document.querySelector("#user-playlists >ul");
    userPlaylist.innerHTML = "";
    for (let { name, id } of playlists.items) {
        const li = document.createElement("li");
        li.textContent = name;
        li.className = "cursor-pointer hover:text-primary "
        li.addEventListener("click", () => onUserPlaylistClick(id));
        userPlaylist.appendChild(li);
    }
}

document.addEventListener("DOMContentLoaded", async () => {
    const volume = document.querySelector("#volume");
    const playButton = document.querySelector("#play");
    const nextTrack = document.querySelector("#next");
    const prevTrack = document.querySelector("#prev");
    const songDurationCompleted = document.querySelector("#song-duration-completed");
    const songProgress = document.querySelector("#progress");
    const timeline = document.querySelector("#timeline");
    const audioControl = document.querySelector("#audio-control");

    let progressInterval;

    ({ displayName } = await loadUserProfile());
    loadUserPlaylist();
    const section = { type: SECTIONTYPE.DASHBOARD };
    history.pushState(section, "", "");
    loadSection(section);
    document.addEventListener("click", () => {
        const profileMenu = document.querySelector("#profile-menu");
        if (!profileMenu.classList.contains("hidden")) {
            profileMenu.classList.add("hidden")
        }
    })

    audio.addEventListener("loadedmetadata", onAudioMetadataLoaded);
    audio.addEventListener("play", () => {
        const selectedTrackId = audioControl.getAttribute("data-track-id");
        const tracks = document.querySelector("#tracks");
        const playingTrack = tracks?.querySelector(`section.playing`);
        const selectedTrack = tracks?.querySelector(`[id="${selectedTrackId}"]`);
        if (playingTrack?.id !== selectedTrack?.id) {
            playingTrack?.classList.remove("playing");
        }
        selectedTrack?.classList.add("playing");

        progressInterval = setInterval(() => {
            if (audio.paused) {
                return
            }
            songDurationCompleted.textContent = `${audio.currentTime.toFixed(0) < 10 ? "0:0" + audio.currentTime.toFixed(0) : "0:" + audio.currentTime.toFixed(0)}`;
            songProgress.style.width = `${(audio.currentTime / audio.duration) * 100}%`;
        }, 100);
        updateIconsForPlayMode(selectedTrackId);
    });
    audio.addEventListener("pause", () => {
        if (progressInterval) {
            clearInterval();
        }
        const selectedTrackId = audioControl.getAttribute("data-track-id");
        updateIconsForPauseMode(selectedTrackId);
    })

    volume.addEventListener("change", () => {
        audio.volume = volume.value / 100;
    })

    timeline.addEventListener("click", (e) => {
        const timelineWidth = window.getComputedStyle(timeline).width;
        const timeToSeek = (e.offsetX / parseInt(timelineWidth)) * audio.duration;
        audio.currentTime = timeToSeek;
        songProgress.style.width = `${(audio.currentTime / audio.duration) * 100}%`;
    }, false);

    playButton.addEventListener("click", togglePlay);
    prevTrack.addEventListener("click", playPrevTrack);
    nextTrack.addEventListener("click", playNextTrack)

    window.addEventListener("popstate", (event) => {
        console.log(event);
        loadSection(event.state);
    })
})