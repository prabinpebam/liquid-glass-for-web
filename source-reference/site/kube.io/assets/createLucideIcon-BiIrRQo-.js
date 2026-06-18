import{j as i,r as m}from"./index-DT87w8C9.js";import{c as u}from"./compiler-runtime-DfXWe3BM.js";import{c as j}from"./index-BccXUWLm.js";const g=["JAN","FEB","MAR","APR","MAY","JUN","JUL","AUG","SEP","OCT","NOV","DEC"],d=s=>{const e=u.c(11),{date:t,showYear:a}=s,l=a===void 0?!0:a;let r;e[0]!==t.year||e[1]!==l?(r=l&&i.jsx("div",{className:"text-[1.125rem] leading-4.5",children:t.year}),e[0]=t.year,e[1]=l,e[2]=r):r=e[2];let n;e[3]!==t.month?(n=t.month&&i.jsx("div",{className:"text-[1.25rem] flex justify-between leading-5",children:g[t.month-1].split("").map(w)}),e[3]=t.month,e[4]=n):n=e[4];let o;e[5]!==t.day?(o=t.day&&i.jsx("div",{className:"flex justify-between text-[2.2rem] tabular-nums leading-[2.2rem]",children:[t.day<10?"0":null,...t.day.toString().split("")].map(C)}),e[5]=t.day,e[6]=o):o=e[6];let c;return e[7]!==r||e[8]!==n||e[9]!==o?(c=i.jsxs("div",{className:"flex flex-col text-lg tabular-nums space-y-1 text-gray-500",children:[r,n,o]}),e[7]=r,e[8]=n,e[9]=o,e[10]=c):c=e[10],c},y=s=>{const e=u.c(11),{from:t,to:a}=s;let l;e[0]!==a?(l=!a&&i.jsx("div",{className:"leading-4 uppercase text-sm flex justify-between mb-1.5",children:"Since".split("").map(N)}),e[0]=a,e[1]=l):l=e[1];let r;e[2]!==t?(r=i.jsx(d,{date:t}),e[2]=t,e[3]=r):r=e[3];let n;e[4]!==t||e[5]!==a?(n=a&&i.jsxs(i.Fragment,{children:[i.jsx("div",{className:"text-center leading-4",children:"—"}),i.jsx(d,{date:a,showYear:a.year!==t.year})]}),e[4]=t,e[5]=a,e[6]=n):n=e[6];let o;return e[7]!==l||e[8]!==r||e[9]!==n?(o=i.jsxs(i.Fragment,{children:[l,r,n]}),e[7]=l,e[8]=r,e[9]=n,e[10]=o):o=e[10],o},k=s=>{const e=u.c(8),{style:t,className:a,date:l}=s;let r;e[0]!==a?(r=j("text-lg tabular-nums text-gray-500",a),e[0]=a,e[1]=r):r=e[1];let n;e[2]!==l?(n="from"in l?i.jsx(y,{from:l.from,to:l.to}):i.jsx(d,{date:l}),e[2]=l,e[3]=n):n=e[3];let o;return e[4]!==t||e[5]!==r||e[6]!==n?(o=i.jsx("div",{style:t,className:r,children:n}),e[4]=t,e[5]=r,e[6]=n,e[7]=o):o=e[7],o};function w(s,e){return i.jsx("span",{children:s},e)}function C(s,e){return i.jsx("span",{children:s},e)}function N(s,e){return i.jsx("span",{children:s},e)}/**
 * @license lucide-react v0.525.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const b=s=>s.replace(/([a-z0-9])([A-Z])/g,"$1-$2").toLowerCase(),v=s=>s.replace(/^([A-Z])|[\s-_]+(\w)/g,(e,t,a)=>a?a.toUpperCase():t.toLowerCase()),f=s=>{const e=v(s);return e.charAt(0).toUpperCase()+e.slice(1)},x=(...s)=>s.filter((e,t,a)=>!!e&&e.trim()!==""&&a.indexOf(e)===t).join(" ").trim(),A=s=>{for(const e in s)if(e.startsWith("aria-")||e==="role"||e==="title")return!0};/**
 * @license lucide-react v0.525.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */var E={xmlns:"http://www.w3.org/2000/svg",width:24,height:24,viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:2,strokeLinecap:"round",strokeLinejoin:"round"};/**
 * @license lucide-react v0.525.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const R=m.forwardRef(({color:s="currentColor",size:e=24,strokeWidth:t=2,absoluteStrokeWidth:a,className:l="",children:r,iconNode:n,...o},c)=>m.createElement("svg",{ref:c,...E,width:e,height:e,stroke:s,strokeWidth:a?Number(t)*24/Number(e):t,className:x("lucide",l),...!r&&!A(o)&&{"aria-hidden":"true"},...o},[...n.map(([p,h])=>m.createElement(p,h)),...Array.isArray(r)?r:[r]]));/**
 * @license lucide-react v0.525.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const U=(s,e)=>{const t=m.forwardRef(({className:a,...l},r)=>m.createElement(R,{ref:r,iconNode:e,className:x(`lucide-${b(f(s))}`,`lucide-${s}`,a),...l}));return t.displayName=f(s),t};export{k as T,U as c};
