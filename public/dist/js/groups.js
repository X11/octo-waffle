function post(t,e,n){n=n||"post";var o=document.createElement("form");o.setAttribute("method",n),o.setAttribute("action",t);for(var r in e)if(e.hasOwnProperty(r)){var a=document.createElement("input");a.setAttribute("type","hidden"),a.setAttribute("name",r),a.setAttribute("value",e[r]),o.appendChild(a)}document.body.appendChild(o),o.submit()}function applyClick(t){var e=[].slice.call(t.target.parentNode.parentNode.childNodes),n={description:e[2].textContent,members:e[5].textContent,name:e[1].textContent,logo:e[3].textContent,url:e[4].textContent,id:e[0].textContent};post("/manage/update/"+e[0].innerHTML,n,"post")}for(var buttons=[].slice.call(document.querySelectorAll(".btn-apply")),node=0,len=buttons.length;len>node;node++)buttons[node].addEventListener("click",applyClick);
//# sourceMappingURL=groups.js.map