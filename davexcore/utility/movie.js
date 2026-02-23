const axios = require("axios");
const { createFakeContact, getBotName } = require('../../davelib/fakeContact');
async function movieCommand(sock, chatId, message) {
    const fake = createFakeContact(message);
    
    const text = message.message?.conversation || 
                 message.message?.extendedTextMessage?.text || '';
    
    const query = text.split(' ').slice(1).join(' ').trim();
    
    if (!query) {
        return sock.sendMessage(chatId, { 
            text: "Example: .movie Avengers Endgame\nProvide movie name"
        }, { quoted: fake });
    }

    try {
        const response = await axios.get(`http://www.omdbapi.com/?apikey=742b2d09&t=${encodeURIComponent(query)}&plot=full`);
        
        if (!response.data || response.data.Response === 'False') {
            return sock.sendMessage(chatId, { 
                text: "Movie not found"
            }, { quoted: fake });
        }

        const fids = response.data;
        let info = "";

        info += "━━━━━━━━━━━━━━━━━━━━━━━━\n";
        info += "DAVE X MOVIE SEARCH\n";
        info += "━━━━━━━━━━━━━━━━━━━━━━━━\n";
        info += "Title: " + fids.Title + "\n";
        info += "Year: " + fids.Year + "\n";
        info += "Rated: " + fids.Rated + "\n";
        info += "Released: " + fids.Released + "\n";
        info += "Runtime: " + fids.Runtime + "\n";
        info += "Genre: " + fids.Genre + "\n";
        info += "Director: " + fids.Director + "\n";
        info += "Writer: " + fids.Writer + "\n";
        info += "Actors: " + fids.Actors + "\n";
        info += "Plot: " + fids.Plot + "\n";
        info += "Language: " + fids.Language + "\n";
        info += "Country: " + fids.Country + "\n";
        info += "Awards: " + fids.Awards + "\n";
        info += "BoxOffice: " + fids.BoxOffice + "\n";
        info += "Production: " + fids.Production + "\n";
        info += "IMDb Rating: " + fids.imdbRating + "\n";
        info += "IMDb Votes: " + fids.imdbVotes + "\n";
        info += "━━━━━━━━━━━━━━━━━━━━━━━━\n";

        await sock.sendMessage(chatId, {
            image: {
                url: fids.Poster,
            },
            caption: info,
        }, { quoted: fake });

    } catch (e) {
        console.error("Movie Error:", e);
        await sock.sendMessage(chatId, { 
            text: "Failed to fetch movie info"
        }, { quoted: fake });
    }
}

module.exports = movieCommand;