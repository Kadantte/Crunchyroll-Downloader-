## Crunchyroll Downloader

<img src="assets/example.png">

<img src="assets/example2.png">

This is a GUI application that lets you download anime episodes from Crunchyroll and HIDIVE.

### Features:
- Download anime episodes in mp4 format, and specify a quality (1080p, 720p, 480p, etc.)
- Download episodes with soft subtitles in mkv format
- Download the audio of an episode in mp3 format
- Download the m3u8 playlist (very fast, and still playable with the VLC player)
- Download all of the episode thumbnails in png format
- Download the subtitles of an episode (ass or vtt)
- Download all of the episodes in a season (detected by the link or if the search query has no numbers)
- If you have a premium account you can login to download premium episodes
- Use the web browser to download directly from the website
- Control the conversion process (pause, resume, stop, delete, etc.)

### Searching
The application attempts to search for the provided anime, so to download Konosuba for example you can simply type "konosuba". This downloads all episodes, to download a specific episode append a number, ex. "konosuba 1" only downloads the first episode. To download episodes 2-4, you can type "konosuba 2-4". 

This doesn't work for every anime, so for the highest accuracy you can provide a direct link. Links to a specific episode and links to the page of the anime are supported. If you provide a link to the anime page, you can also append a number to download a specific episode range.

Update: Searching with a query isn't supported anymore.

### Output Template

You can specify a custom output path. The default is `{seasonTitle} {episodeNumber}`. Adding slashes will create sub-folders, ex. `{seriesTitle}/{seasonTitle}/{episodeTitle}`. These are the available replacements:

{seasonTitle} - The title of the season \
{episodeTitle} - The title of the episode \
{seriesTitle} - The title of the series (ex. The series of SAO II is "Sword Art Online") \
{episodeNumber} - The number of the episode \
{resolution} - The resolution (ex. "1080p"). Only available for video formats. \
{language} - The language (ex. "English").

### Advanced Video Options

**Video Quality** - A value from 0-51 where 0 is lossless and 51 is very poor quality. Setting this too low has diminishing returns because it won’t be very noticeable but the filesize would become huge. The recommended range is between 17-28. 

**Video Codec** - Different video coding formats have a different filesize to quality ratios and different computational times. The approximate sizes are for a 720p video. These are the supported codecs:

No Re-Encoding - Original video, huge filesize. (Approx. size - 730MB) \
H.264 - Worst quality to filesize ratio, but fastest. (Approx. size - 180MB) \
H.265 - Best quality and smallest filesize, but has little support. (Approx. size - 120MB) \
VP8 - Good quality, small filesize, but slowest. *Setting the codec to VP8 will also force the output format to be WEBM*. (Approx. size - 130MB) \
VP9 - Better quality and faster than VP8. (Approx. size - 190MB)

### CDM

To download videos from Crunchyroll you have to download a CDM and place the files `device_private_key` and `device_client_id_blob` into the ffmpeg folder. You can find the folder in the location where the app is installed. I won't distribute these files but you can find guides on how to get them online.

### Installation

Download the latest installer from the [releases](https://github.com/Tenpi/Crunchyroll-Downloader/releases) tab.

### Bugs and Requests

You can open an issue on my GitHub repository

### Important

You may only use this for personal usage/offline viewing only. If you like anime then support the industry by buying merch, DVD's, CR premium, etc. You will need to have an active subscription to download most content. 

I'm not affiliated with Crunchyroll or HIDIVE.
