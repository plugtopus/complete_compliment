function main() {
	var Storage = localStorage;
	var textObjs = {};
	var clicked_flag = 0;

	function getAllTextNodes(target) {
		var t_nodes = [];

		var childs = target.childNodes;

		for (var i = 0; i < childs.length; ++i) {
			if (t_nodes.length > 0 && childs[i].nodeName.toLowerCase() == 'div' && t_nodes[t_nodes.length - 1].nodeName.toLowerCase() != 'br') {
				t_nodes.push(document.createElement('br'));
			}
			if (childs[i].firstChild) {
				var arr = getAllTextNodes(childs[i]);
				t_nodes.push.apply(t_nodes, arr);
			} else {
				t_nodes.push(childs[i]);
			}
		}

		return t_nodes;
	}

	function isContains(parent, child) {
		var node = child.parentNode;
		while (node != null) {
			if (node == parent) {
				return true;
			}
			node = node.parentNode;
		}
		return false;
	}

	function getTextWithOffset(target) {
		var text,
			offset,
			start,
			end;

		start = end = -1;

		if (typeof target.selectionStart != "undefined") {
			text = target.value;
			start = target.selectionStart;
			end = target.selectionEnd;
		} else {
			var t_nodes = getAllTextNodes(target);
			var selection = document.getSelection();
			var anchorNode,
				anchorOffset,
				focusNode,
				focusOffset;

			anchorNode = selection.anchorNode;
			anchorOffset = selection.anchorOffset;
			focusNode = selection.focusNode;
			focusOffset = selection.focusOffset;
			if (t_nodes.length > 0) {
				if (anchorNode && (isContains(target, anchorNode) || target == anchorNode) && anchorNode.nodeName != 'BR' && anchorNode.nodeName != '#text') {
					if (anchorNode.childNodes.length > anchorOffset) {
						anchorNode = anchorNode.childNodes[anchorOffset];
						anchorOffset = 0;
					} else {
						anchorNode = anchorNode.childNodes[anchorNode.childNodes.length - 1];
						anchorOffset = (anchorNode.outerHTML || anchorNode.textContent).length;
					}
				}
				if (focusNode && (isContains(target, focusNode) || target == focusNode) && focusNode.nodeName != 'BR' && focusNode.nodeName != '#text') {
					if (focusNode.childNodes.length > focusOffset) {
						focusNode = focusNode.childNodes[focusOffset];
						focusOffset = 0;
					} else {
						focusNode = focusNode.childNodes[focusNode.childNodes.length - 1];
						focusOffset = (focusNode.outerHTML || focusNode.textContent).length;
					}
				}
			}

			text = "";

			for (var i = 0; i < t_nodes.length; ++i) {
				if (t_nodes[i] == anchorNode) {
					start = anchorOffset + text.length;
				}

				if (t_nodes[i] == focusNode) {
					end = focusOffset + text.length;
				}

				if (t_nodes[i].nodeValue) {
					text += t_nodes[i].nodeValue;
				} else if (t_nodes[i].nodeName.toLowerCase() == 'br') {
					text += '<br>';
				} else {
					text += t_nodes[i].outerHTML;
				}
			}
		}

		if (start == -1 && end == -1) {
			start = end = text.length;
		}

		if (start == -1) {
			start = end;
		} else if (end == -1) {
			end = start;
		} else if (start > end) {
			var tmp = start;
			start = end;
			end = tmp;
		}

		text = text.slice(0, start) + text.slice(end, text.length);
		offset = start;

		return {
			"value": text,
			"offset": offset
		};
	}

	function setText(target, text, caretPos) {
		if (typeof target.setSelectionRange != "undefined") {
			target.value = text;
			target.setSelectionRange(caretPos, caretPos);
		} else {
			var curLength = 0;
			var lastLength = 0;
			var rangeNode;

			var text_node = new DOMParser().parseFromString(text, "text/html").querySelector("body");
			target.textContent = '';
			while (text_node.firstChild) {
				target.appendChild(text_node.firstChild);
			}

			var childs = target.childNodes;
			var i;
			for (i = 0, l = childs.length; i < l; i++) {
				if (childs[i].outerHTML) {
					lastLength = childs[i].outerHTML.length;
					curLength += lastLength;
				} else {
					lastLength = childs[i].nodeValue.length;
					curLength += lastLength;
				}

				if (curLength > caretPos) {
					rangeNode = childs[i];
					break;
				}
			}

			if (!rangeNode && i > 0) {
				rangeNode = childs[i - 1];
			}
			if (!rangeNode) {
				return;
			}

			var sel = window.getSelection();
			var range = document.createRange();

			if (rangeNode.nodeName == '#text') {
				range.setStart(rangeNode, caretPos - (curLength - lastLength));
			} else {
				if (caretPos >= text.length) {
					range.setStart(target, target.childNodes.length);
				} else {
					range.setStart(rangeNode, 0);
				}
			}
			range.collapse(true);

			sel.removeAllRanges();
			sel.addRange(range);
		}
	}

	chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
		switch (request.action) {
			case "compliment":
				var text = textObjs[request.data.elemID];
				if (text) {
					var target = document.getElementById(request.data.elemID);
					var newOffset = text.offset + request.data.str.length;

					var newText = [text.value.slice(0, text.offset), request.data.str, text.value.slice(text.offset)].join('');
					setText(target, newText, newOffset);
					target.focus();
					textObjs[request.data.elemID] = getTextWithOffset(target);
					var keyEvent = new KeyboardEvent("keyup");
					target.dispatchEvent(keyEvent);
				}
				clicked_flag--;
				break;
			case "sex":
				setCompliment(request.data.elemID, request.data.sex);
				break;
		}
	});

	function setCompliment(elemID, _sex) {
		var sex = "all";
		if (_sex && _sex == 2) {
			sex = "boy";
		} else if (_sex && _sex == 1) {
			sex = "girl";
		}

		chrome.runtime.sendMessage({
			action: "compliment",
			data: {
				sex: sex,
				elemID: elemID
			}
		});
	}

	function addCompliment(isGroupMsg, userID, item_id) {
		if (!isGroupMsg) {
			chrome.runtime.sendMessage({
				action: "sex",
				data: {
					userID: userID,
					elemID: item_id
				}
			});
		} else {
			setCompliment(item_id);
		}
	}

	function saveCaretPositionAndSelections() {
		if (clicked_flag > 0) {
			return;
		}
		textObjs = {};
		var list = document.getElementsByClassName("im_editable");
		var thisURL = window.location.href;
		var userID = thisURL.match(/\bsel=[^&\d]*(\d+)\b/);
		userID = userID ? userID[1] : userID;
		if (userID) {
			for (var i = 0; i < list.length; i++) {
				var id = list[i].getAttribute("id") || "";
				var target = document.getElementById(id);
				textObjs[id] = getTextWithOffset(target);
			}
		}
	}

	function addButtonForRequest() {
		if (!document.getElementById("macte-magic-vk-love-button")) {
			var isNewVK = false;
			var parent = document.querySelectorAll('.add_media_menu .add_media_items');
			var list = document.getElementsByClassName("im_editable");
			if (!parent.length) {
				parent = document.querySelector('.ms_items_more._more_items');
				isNewVK = true;
			} else {
				parent = parent[parent.length - 1];
			}

			if (!parent) {
				return;
			}


			var el = document.createElement("a");
			el.setAttribute("id", "macte-magic-vk-love-button");
			if (!isNewVK) {
				el.setAttribute("class", "add_media_item");
				el.setAttribute("style", "background-image: url(https://vk.com/images/icons/attach_icons.png?6); background-position: 3px -196px;");
			} else {
				el.setAttribute("class", "ms_item ms_item_gift");
			}
			el.onclick = function () {
				clicked_flag = 0;
				var thisURL = window.location.href;
				var userID = thisURL.match(/\bsel=[^&\d]*(\d+)\b/);
				var isGroupMsg = userID ? userID[0].indexOf("c") != -1 : true;
				userID = userID ? userID[1] : userID;
				if (userID) {
					for (var i = 0; i < list.length; i++) {
						var id = list[i].getAttribute("id") || "";
						clicked_flag++;
						addCompliment(isGroupMsg, userID, id);
					}
				}
			}

			el.addEventListener("mouseover", saveCaretPositionAndSelections);
			for (var i = 0; i < list.length; i++) {
				list[i].removeEventListener("keyup", saveCaretPositionAndSelections);
				list[i].addEventListener("keyup", saveCaretPositionAndSelections);
			}

			var nbr = document.createElement("nobr");
			nbr.textContent = "Комплимент";

			el.appendChild(nbr);

			if (!isNewVK) {
				parent.insertBefore(el, parent.children[parent.children.length > 1 ? 1 : 0]);
			} else {
				parent.appendChild(el);
			}
		}
	}

	var thisURL = window.location.href;

	function gogo() {
		var newURL = window.location.href;
		if (newURL != thisURL) {
			thisURL = newURL;
			if (document.getElementById("macte-magic-vk-love-button")) {
				document.getElementById("macte-magic-vk-love-button").remove();
			}
			if (document.getElementById("macte-magic-vk-love-button-share")) {
				document.getElementById("macte-magic-vk-love-button-share").remove();
			}

		}
		if (thisURL.indexOf("vk.com/im") != -1 && thisURL.indexOf("sel") != -1) {
			addButtonForRequest();
		}

	}

	this.chrome.runtime.sendMessage({
		action: "pageActionShow"
	});

	setInterval(function () {
		gogo();
	}, 100);

}

main();