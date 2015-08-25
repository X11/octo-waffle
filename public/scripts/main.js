/*
 * Author: mvdw 
 * Mail: <mvdw at airmail dot cc>
 * Distributed under terms of the GNU2 license.
 */

var buttons = [].slice.call(document.querySelectorAll('.btn-apply'))

for (var node = 0, len = buttons.length; node < len; node++)
    buttons[node].addEventListener('click', function(e){
        function post(path, params, method) {
            method = method || "post"; // Set method to post by default if not specified.

            // The rest of this code assumes you are not using a library.
            // It can be made less wordy if you use one.
            var form = document.createElement("form");
            form.setAttribute("method", method);
            form.setAttribute("action", path);

            for(var key in params) {
                if(params.hasOwnProperty(key)) {
                    var hiddenField = document.createElement("input");
                    hiddenField.setAttribute("type", "hidden");
                    hiddenField.setAttribute("name", key);
                    hiddenField.setAttribute("value", params[key]);

                    form.appendChild(hiddenField);
                 }
            }
            document.body.appendChild(form);
            form.submit();
        }
        var data = [].slice.call(e.target.parentNode.parentNode.childNodes);
        var user = {
            description: data[2].innerHTML,
            members: data[5].innerHTML,
            name: data[1].innerHTML,
            logo: data[3].innerHTML,
            url: data[4].innerHTML,
            id: data[0].innerHTML,
        };
        post('/manage/update/' + data[0].innerHTML, user, "post");
});
