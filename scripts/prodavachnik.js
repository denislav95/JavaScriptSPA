function startApp() {

    sessionStorage.clear();

    showHideMenuLinks();

    showView('viewHome');

    $('#linkHome').click(showViewHome);

    $('#linkLogin').click(showViewLogin);

    $('#linkRegister').click(showViewRegister);

    $('#linkCreateAd').click(showViewCreateAd);

    $('#buttonLoginUser').click(loginUser);

    $('#linkLogout').click(logoutUser);

    $('#buttonRegisterUser').click(registerUser);

    $('#linkListAds').click(listAds);

    $('#buttonCreateAd').click(createAd);

    $('#buttonEditAd').click(editAd);

    // Attach AJAX "loading" event listener
    $(document).on({
        ajaxStart: function() { $("#loadingBox").show() },
        ajaxStop: function() { $("#loadingBox").hide() }
    });

    const kinveyBaseUrl = "https://baas.kinvey.com/";
    const kinveyAppKey = "kid_rydqjBWmg";
    const kinveyAppSecret =
        "55000cc88a8446dba78f00b0910ca7bb";
    const kinveyAppAuthHeaders = {
        'Authorization': "Basic " +
        btoa(kinveyAppKey + ":" + kinveyAppSecret)
    };

    function loginUser() {
        let userData = {
            username: $('#formLogin input[name=username]').val(),
            password: $('#formLogin input[name=passwd]').val()
        };

        $.ajax({
            method: 'POST',
            url: kinveyBaseUrl + 'user/' + kinveyAppKey + '/login',
            data: userData,
            headers: kinveyAppAuthHeaders,
            success: loginUserSuccess,
            error: ajaxError
        });

        function loginUserSuccess(userInfo) {
            saveAuthUserInSession(userInfo);

            showHideMenuLinks();

            showInfo('Login successful.');

            listAds();
        }
    }

    function logoutUser() {
        sessionStorage.clear();

        showHideMenuLinks();

        showInfo('Logout successful.');

        showView('viewHome');
    }

    function registerUser() {
        let userData = {
            username: $('#formRegister input[name=username]').val(),
            password: $('#formRegister input[name=passwd]').val()
        };

        $.ajax({
            method: 'POST',
            url: kinveyBaseUrl + 'user/' + kinveyAppKey + '/',
            data: userData,
            headers: kinveyAppAuthHeaders,
            success: registerUserSuccess,
            error: ajaxError
        });

        function registerUserSuccess(userInfo) {
            saveAuthUserInSession(userInfo);

            showInfo('Registration successful.');

            showHideMenuLinks();

            listAds();
        }
    }

    function listAds() {
        $('#ads').empty();

        showView('viewAds');

        $.ajax({
            method: 'GET',
            url: kinveyBaseUrl + 'appdata/' + kinveyAppKey + '/ads',
            headers: getKinveyAuthUserHeaders(),
            success: listAdsSuccess,
            error: ajaxError
        });

        function listAdsSuccess(ads) {
            if(ads.length == 0){
                $('#ads').text('No ads in the database')
            }else{
            
                let table = $('<table>');

                table.append($('<tr>').append(
                    $('<th>Title</th><th>Description</th><th>Publisher</th>'),
                    $('<th>Date Published</th><th>Price</th><th>Actions</th>')
                ));

                for(let ad of ads){
                    appendAdRow(ad, table)
                }

                $('#ads').append(table);

                showInfo('Ads loaded.');
            }

            function appendAdRow(ad, table) {
                let links = [];

                if(ad._acl.creator == sessionStorage.getItem('userId')){
                    let deleteLink = $('<a href="#">Delete</a>')
                        .click(function () {
                            deleteAd(ad._id);
                        });
                    let editLink = $('<a href="#">Edit</a>')
                        .click(function () {
                            loadAdForEdit(ad._id);
                        });

                    links.push(deleteLink);
                    links.push(' ');
                    links.push(editLink);
                }

                table.append($('<tr>').append(
                    $('<td>').text(ad.title),
                    $('<td>').text(ad.description),
                    $('<td>').text(ad.publisher),
                    $('<td>').text(ad.datepublished),
                    $('<td>').text(ad.price),
                    $('<td>').append(links)
                ));
            }
        }
    }

    function loadAdForEdit(adId) {
        $.ajax({
            method: 'GET',
            url: kinveyBaseUrl + 'appdata/' + kinveyAppKey + '/ads/' + adId,
            headers: getKinveyAuthUserHeaders(),
            success: loadAdForEditSuccess,
            error: ajaxError
        });

        function loadAdForEditSuccess(ad) {
            $('#formEditAd input[name=id]').val(ad._id);
            $('#formEditAd input[name=publisher]').val(ad.publisher);
            $('#formEditAd input[name=title]').val(ad.title);
            $('#formEditAd textarea[name=description]').val(ad.description);
            $('#formEditAd input[name=datePublished]').val(ad.datepublished);
            $('#formEditAd input[name=price]').val(ad.price);

            showView('viewEditAd');
        }
    }

    function editAd() {

        let adData = {
            title: $('#formEditAd input[name=title]').val(),
            description: $('#formEditAd textarea[name=description]').val(),
            publisher: $('#formEditAd input[name=publisher]').val(),
            datepublished: $('#formEditAd input[name=datePublished]').val(),
            price: $('#formEditAd input[name=price]').val()
        };

        $.ajax({
            method: 'PUT',
            url: kinveyBaseUrl + 'appdata/' + kinveyAppKey + '/ads/' +
                $('#formEditAd input[name=id]').val(),
            data: adData,
            headers: getKinveyAuthUserHeaders(),
            success: editAdSuccess,
            error: ajaxError
        });

        function editAdSuccess() {

            showInfo('Ad edited.');

            listAds();
        }
    }

    function deleteAd(adId) {
        $.ajax({
            method: 'DELETE',
            url: kinveyBaseUrl + 'appdata/' + kinveyAppKey + '/ads/' + adId,
            headers: getKinveyAuthUserHeaders(),
            success: deleteAdSuccess,
            error: ajaxError
        });

        function deleteAdSuccess() {
            showInfo('Ad deleted.');

            listAds();
        }
    }

    function createAd() {
        let adData = {
            title: $('#formCreateAd input[name=title]').val(),
            description: $('#formCreateAd textarea[name=description]').val(),
            publisher: sessionStorage.getItem('username'),
            datepublished: $('#formCreateAd input[name=datePublished]').val(),
            price: $('#formCreateAd input[name=price]').val()
        };

        $.ajax({
            method: 'POST',
            url: kinveyBaseUrl + 'appdata/' + kinveyAppKey + '/ads',
            data: adData,
            headers: getKinveyAuthUserHeaders(),
            success: createAdSuccess,
            error: ajaxError
        });
        
        function createAdSuccess() {
            showInfo('Ad created successful.');

            listAds();
        }
    }

    function getKinveyAuthUserHeaders() {
        return {
          'Authorization': 'Kinvey '
            + sessionStorage.getItem('authToken')
        };
    }

    function saveAuthUserInSession(userInfo) {
        sessionStorage.setItem('username', userInfo.username);
        sessionStorage.setItem('authToken', userInfo._kmd.authtoken);
        sessionStorage.setItem('userId', userInfo._id);

        $('#loggedInUser').text('Welcome, ' + userInfo.username).show();
    }

    function showInfo(text){
        $('#infoBox').text(text).show();
        setTimeout(function () {
            $('#infoBox').fadeOut('slow');
        }, 2000)
    }

    function ajaxError(response) {
        let errorMsg = JSON.stringify(response);

        if(response.readyState == 0){
            errorMsg = 'Cannot connect due to no internet connection';
        }

        if(response.responseJSON && response.responseJSON.description){
            errorMsg = response.responseJSON.description;
        }

        showError(errorMsg);
    }

    function showError(errorMsg) {
        $('#errorBox').text(errorMsg).show();
        $('#errorBox').click(function () {
            $(this).fadeOut('slow');
        })
    }

    function showViewRegister() {
        showView('viewRegister');
    }

    function showViewHome() {
        showView('viewHome');
    }

    function showViewLogin() {
        showView('viewLogin');
    }

    function showViewCreateAd() {
        showView('viewCreateAd')
    }

    function showView(selector) {
        $('main section').hide();
        $('#' + selector).show();
    }

    function showHideMenuLinks() {

        $('#linkHome').show();

        if(sessionStorage.getItem('authToken')){
            $('#linkLogin').hide();
            $('#linkRegister').hide();
            $('#linkCreateAd').show();
            $('#linkListAds').show();
            $('#linkLogout').show();
        }else{
            $('#linkLogin').show();
            $('#linkRegister').show();
            $('#linkCreateAd').hide();
            $('#linkListAds').hide();
            $('#linkLogout').hide();
            $('#loggedInUser').hide();
        }
    }
}