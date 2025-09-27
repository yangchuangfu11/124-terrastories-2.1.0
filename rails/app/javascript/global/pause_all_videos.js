// Pause All Playing Videos
//
// This function is called when a video is played (by binding to the `play`
// event), and it used to stop any other videos from continuing to play.
function pauseAllVideos(elem) {
  const videos = document.querySelectorAll("video");

  videos.forEach((video) => {
    if (video === elem) {
      return;
    }

    if (video.played.length > 0 && !video.paused) {
      video.pause();
    }
  });
}

window.pauseAllVideos = pauseAllVideos;
