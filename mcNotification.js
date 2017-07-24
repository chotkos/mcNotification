/////////
/*
add to default.aspx

    <script type="text/javascript" src="/_layouts/15/MicrosoftAjax.js"></script>
    <script type="text/javascript" src="/_layouts/15/sp.runtime.js"></script>
    <script type="text/javascript" src="/_layouts/15/sp.js"></script>
    <script type="text/javascript" src="/_Layouts/15/SP.RequestExecutor.js"></script>
    <script type="text/javascript">
    $(document).ready(function () {
	    SP.SOD.executeFunc('sp.js', 'SP.ClientContext'); 	    
	    currentContext = new SP.ClientContext.get_current();
	});
    <!--Here add the reference to this js file-->
*/
//////
var mcNotification = {
    observedLists: []
    , registerList: function (listName, linkUrl, textInfo) {
        mcNotification.observedLists.push({
            listName: listName
            , 'lastDate': 0
            , 'linkUrl': linkUrl
            , 'textInfo': textInfo
        });
    }
    , sendNotification: function (info, url, icon) {
        var notify = function (listName, url, icon) {
            var options = {
                icon: icon
            , };
            var notification = new Notification(info, options);
            notification.onclick = function (event) {
                event.preventDefault(); // prevent the browser from focusing the Notification's tab
                window.open(url, '_blank');
            };
        };
        // Sprawdzamy czy przeglądarka obsługuje powiadomienia.
        if (!("Notification" in window)) {
            alert("Ta przeglądarka nie obsługuje powiadomień, wypróbuj Google Chrome!");
        }
        // Sprawdźmy czy uprawnienia dla powiadomienia zostały nadane
        else if (Notification.permission === "granted") {
            // jeżeli są tworzymy powiadomienie
            notify(info, url, icon);
        }
        // W innym przypadku tworzymy zapytanie o uprawnienia
        else if (Notification.permission !== 'denied') {
            Notification.requestPermission(function (permission) {
                //Jeżeli użytkownik zaakceptuje tworzymy powiadomienie
                if (permission === "granted") {
                    notify(info, url, icon);
                }
            });
        }
    }
    , createCookie: function (name, value, days) {
        var expires = "";
        if (days) {
            var date = new Date();
            date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
            expires = "; expires=" + date.toUTCString();
        }
        document.cookie = name + "=" + value + expires + "; path=/";
    }
    , readCookie: function (name) {
        var nameEQ = name + "=";
        var ca = document.cookie.split(';');
        for (var i = 0; i < ca.length; i++) {
            var c = ca[i];
            while (c.charAt(0) == ' ') c = c.substring(1, c.length);
            if (c.indexOf(nameEQ) == 0) return c.substring(nameEQ.length, c.length);
        }
        return null;
    }
    , eraseCookie: function (name) {
        mcNotification.createCookie(name, "", -1);
    }
    , run: function (refreshTime, siteUrl, logo) {
        var clientContext = new SP.ClientContext(siteUrl);
        setInterval(function () {
            for (var i = 0; i < mcNotification.observedLists.length; i++) {
                let item = mcNotification.observedLists[i];
                let oList = clientContext.get_web().get_lists().getByTitle(item.listName);
                let x = clientContext.load(oList);
                clientContext.executeQueryAsync(function () {
                    let lastmodified = oList.get_lastItemModifiedDate();
                    item.lastDate = new Date(mcNotification.readCookie(item.listName));
                    if (lastmodified > item.lastDate) {
                        item.lastDate = lastmodified;
                        mcNotification.eraseCookie(item.listName);
                        mcNotification.createCookie(item.listName, item.lastDate, 3);
                        mcNotification.sendNotification(item.textInfo, item.linkUrl, logo);
                    }
                }, function (sender, args) {
                    console.log('Request failed. ' + args.get_message() + '\n' + args.get_stackTrace());
                });
            }
        }, refreshTime);
    }
};
mcNotification.registerList('Lista aktualności', "http://sp-matcho/SitePages/NewsArchive.aspx", "Intranet - dodano nową aktualność");
mcNotification.registerList('Menu', "http://sp-matcho/Lists/Menu", "Intranet - dodano nowy wpis w menu obiadowym");
mcNotification.registerList('Galeria', "http://sp-matcho/SitePages/Galeria.aspx", "Intranet - dodano nowy element w galerii");
mcNotification.registerList('Dokumenty', "http://sp-matcho/Shared%20Documents/Forms/AllItems.aspx", "Intranet - dodano nowy element w dokumentach");
setTimeout(function () {
    mcNotification.run(1000, '/', "http://sp-matcho/_layouts/15/HURO._Client_.MasterData/Images/notificationlogo.png")
}, 2000)
