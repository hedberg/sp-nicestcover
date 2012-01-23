/**
 * Two albums acting as vote buttons
 * Select best album cover
 * # Voting
 * 1. Fetch and display albums
 *   - fetch two candidates from a pre-set albumlist
 *   - check if previously matched (if already matched, fetch again)
 *   - display two album covers
 * 2. Register vote
 *   - parameters clicked, not clicked album
 *   - store vote stats - album, wins, losses
 *   - store match history - winner_album, looser_album 
 *
 *# Results
 * 1. Display results - best, worst 10
 *   - Fetch albums with highest / worst vote stats
 *   - Display list of album covers (Best / Worst) with win percentage 
 */
"use strict";
var m = sp.require('sp://import/scripts/api/models'),
	v = sp.require('sp://import/scripts/api/views');
var	ui = sp.require("sp://import/scripts/ui");
var application = m.application;
var player = m.player;
var playlist_uri = 'spotify:user:rvm:playlist:1wEZCq3guSJejot5MvZcwW';

function factorial(n) {
	if (n <= 1) return 1;
	return n*factorial(n-1);
}

// Handle URI arguments

function handleArgs() {
	var args = m.application.arguments;
	//console.log("args", args);
	$("section").hide();	// Hide all sections
	$("#"+args[0]).fadeTo(400,1);	// Show current section
	render_results();

}


var albums = [];
var pastRounds = [];
var max_combinations = 0;
function populate_album_list(result) {
	//console.log(result.tracks.length);
	var added = [];
	for(var i=0; i < result.tracks.length; i++) {
		var album = result.tracks[i].data.album;
		if (added.indexOf(album.uri) == -1) {
			albums.push({'uri': album.uri, 'cover': album.cover, 'wins': 0, 'losses': 0});
			added.push(album.uri);
		}
	}
	max_combinations = factorial(albums.length) / (factorial((albums.length-2)) * factorial(2));
	new_rate_round();
}
exports.init = init;
function init() {
		m.Playlist.fromURI(playlist_uri, populate_album_list);
		application.observe(m.EVENT.ARGUMENTSCHANGED, handleArgs);
		$("#album1").click(function(){vote($(this).attr("albumid"),$("#album2").attr("albumid"))});
		$("#album2").click(function(){vote($(this).attr("albumid"),$("#album1").attr("albumid"))});

}
function vote(winner, looser){
	for (var i=0; i < albums.length; i++) {
		if (albums[i].uri == winner) {
			albums[i].wins = albums[i].wins + 1;
		}
		if (albums[i].uri == looser) {
			albums[i].losses = albums[i].losses + 1;
		}
	}
	new_rate_round();
}

function new_rate_round(){
	//console.log("new round, dude!");
	//fetch
	var choices = getNewRound();
	if (choices === false) {
		alert("All albums compared");
		return;
	}
	//update
	$("#album1 div").css("background-image","url("+choices[0].cover+")");
	$("#album2 div").css("background-image","url("+choices[1].cover+")");
	$("#album1").attr("albumid", choices[0].uri);
	$("#album2").attr("albumid", choices[1].uri);
}

function getNewRound() {
	var a1, a2;
	while (pastRounds.length<max_combinations) {
		a1 = albums[Math.floor(Math.random()*albums.length)];
		a2 = albums[Math.floor(Math.random()*albums.length)];
		var round = [a1.uri, a2.uri];
		round.sort();
		var round_str = round[0] +'_' +round[1]
		if (pastRounds.indexOf(round_str) === -1 && a1 !== a2) {
			pastRounds.push(round_str);
			return [a1, a2];
		}
	}
	return false;
}

function render_results() {
	var results = [];
	for (var i=0; i<albums.length; i++) {
		var total = (0.0 + albums[i].wins + albums[i].losses);
		var percent = 0;
		if (total > 0) {
			 percent = Math.round((albums[i].wins / total) * 100);
		}
		results.push({'album': albums[i], 'percent': percent});
	}
	results.sort(function (a,b) {return b.percent - a.percent;})
	$("#topalbums").html("");
	for (var i=0; i < 10; i++) {
		$("#topalbums").append('<div class="icon"><div class="sp-image" style="background-image: url('+ results[i].album.cover +'); "></div><span class="percent">' +results[i].percent +'%</span></div>')
	}
}

