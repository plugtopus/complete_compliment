chrome.runtime.onInstalled.addListener(function (details) {
	if (details.reason == "install" && !localStorage.landing && !localStorage['first_date_installation_bbpromo']) {
		localStorage['first_date_installation_bbpromo'] = new Date().getTime();
		chrome.management.getSelf(function (info) {
			var ext_name = encodeURIComponent(info.name);
			chrome.tabs.create({
				url: 'https://plugtopus.agency/'
			});
		});
	}
});