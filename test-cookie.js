const cookie = require('cookie');

// Test the cookie parsing
const testCookie = "singular_device_id=77846d8e-3685-4244-aa35-ebdec423d487; _gcl_au=1.1.1682215398.1756948520; _axwrt=5756d254-71f6-4ee2-8e4b-2ceabfc98907; _ga=GA1.1.1334009902.1756948521; ajs_anonymous_id=318e0e3f-fc7d-4c97-9033-de2ea95b3e7f; _fbp=fb.1.1756948520849.419953202323512398; _tt_enable_cookie=1; _ttp=01K494NR69EMQ37M6TQWGWH5BV_.tt.1; _clck=1nn6e29%5E2%5Efz1%5E0%5E2073; afUserId=c40e687b-9b26-4eb7-9596-b2cf08428eb8-p; AF_SYNC=1756948522623; __stripe_mid=bd0188a1-3e3b-46eb-932a-85348e2092773aaf5f; __stripe_sid=7d5e4ac3-0333-4186-a13f-137e44f32982b72f38; __client=eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6ImNsaWVudF8zMkRJM3JEUU51cXpCclFMSUJIblRZaTJCV0EiLCJyb3RhdGluZ190b2tlbiI6Im5wbGkzOW11ZmU5b2NuemUwYnJzNTJrOTBlaXBmYmNmd2MzZWZ2cXMifQ.OjxVt4SQiwPuFXJ3bHWXD0Y8dtvNUeAo0uXQeUPqiSeDl6GiLV-Qo9d_ReaWHlAm_WP8fXn5B2bF5W466BcuoY3aHBGNBcfNKeyPwTKv8xhxiTL_v8SOwibAiQe7WNY2vEMZeQLDQLSIbcdOd7LQAplln-rQdt7kCzzk1YsN7KkZ3RpnwoIL2EFqJm3ULemmg4ochFi2Tc0KIrHv6_91_mEL3YC5cimzb_rRTazrmWBNm-_Kws7A1T1b3ilnUNRhknGOSrcJdtXzWUaJnEl9zvfx33JJVKTBhB89IwXh7Pnydj_Z4rS2F57eBx00LEkYZ3l8jdLYvBwiHjpCfF4gVA; __client_uat=1757295344; __client_uat_U9tcbTPE=1757295344; __cf_bm=bt5i7Hmbk3v_KKylu5p9ONohx1PointLrcINevAsAFE-1757295378-1.0.1.1-ly8DsXGSDgtr5ztDLqSvY8q66sawBuWESRuZGbC4iyzRThZ27CqED.ay9HRO71W8pSvfgj7LbEs4IIclMDwuOLblbCbV7TrcTU1I7ajkyV8; _cfuvid=4ay4JE3BpmdyIThtccXUPqPKOAu9amz6mOGrNjHtg1I-1757295378363-0.0.1.1-604800000; _ga_7B0KEDD7XP=GS2.1.s1757294422$o3$g1$t1757295378$j27$l0$h0; _uetsid=ff5ecfd08c5111f094c93f6111511dd4|k1qgiz|2|fz5|0|2077; ax_visitor=%7B%22firstVisitTs%22%3A1756948520812%2C%22lastVisitTs%22%3A1756958339487%2C%22currentVisitTs%22%3A1757294423507%2C%22ts%22%3A1757295378561%2C%22visitCount%22%3A3%7D; ttcsid=1757294425524::jcVauZhbxV44BdCLdapy.2.1757295378580; _uetvid=a06b0f30892c11f08eb00357fb181f53|1l1pnnt|1757295378817|5|1|bat.bing.com/p/conversions/c/v; ttcsid_CT67HURC77UB52N3JFBG=1757294425524::YFEEOJozCcJBkLkGw0yb.2.1757295378906";

console.log("Cookie length:", testCookie.length);
const parsedCookies = cookie.parse(testCookie);
console.log("Parsed cookies:");
console.log("Has __client:", !!parsedCookies.__client);
console.log("__client value:", parsedCookies.__client ? parsedCookies.__client.substring(0, 50) + "..." : "undefined");

console.log("\nAll cookie keys:");
Object.keys(parsedCookies).forEach(key => {
  console.log(`${key}: ${parsedCookies[key] ? parsedCookies[key].substring(0, 30) + "..." : "undefined"}`);
});

