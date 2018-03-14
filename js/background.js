function ajax(url, callback, errback) {
	var xmlhttp = new XMLHttpRequest();
	xmlhttp.open('GET', url, true);
	xmlhttp.onreadystatechange = function () {
		if (xmlhttp.readyState == 4) {
			if (xmlhttp.status == 200) {
				callback(xmlhttp.responseText);
			} else {
				errback();
			}
		}
	};
	xmlhttp.send(null);
}

var isFF = window.navigator.userAgent.indexOf("Firefox/") > 0;
var sex_cache = {};

function getCompliment(data, callback) {
	data.str = Comliments.getRandomFor(data.sex);
	data.str = data.str.trim();
	if (!/[.!?]$/.test(data.str)) {
		data.str += '...';
	}
	data.str += ' ';
	callback(data);
}

function getSex(data, callback) {
	if (sex_cache[data.userID]) {
		data.sex = sex_cache[data.userID];
		callback(data);
	} else {
		ajax("http://api.vk.com/method/users.get?v=4.1&uids=" + data.userID + "&fields=sex",
			function (response) {
				try {
					var sex = JSON.parse(response)['response'][0].sex;
					sex_cache[data.userID] = sex;
					data.sex = sex;
					callback(data);
				} catch (e) {
					callback(data);
				}
			},
			function () {
				callback(data);
			});
	}
}

chrome.runtime.onMessage.addListener(
	function (request, sender, sendResponse) {
		switch (request.action) {
			case "compliment":
				getCompliment(request.data, function (data) {
					chrome.tabs.sendMessage(sender.tab.id, {
						action: "compliment",
						data: data
					});
				});
				break;
			case "sex":
				getSex(request.data, function (data) {
					chrome.tabs.sendMessage(sender.tab.id, {
						action: "sex",
						data: data
					});
				});
				break;
			case "pageActionShow":
				if (!isFF) {
					chrome.pageAction.show(sender.tab.id);
				}
				break;
		}
	}
);