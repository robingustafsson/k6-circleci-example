import http from "k6/http";
import { check, group, sleep } from "k6";
import { Rate } from "k6/metrics";

let checkSuccessRate = new Rate("check_success_rate");

export let options = {
    stages: [
        { duration: "5s", target: 10 },
        { duration: "5s", target: 10 },
        { duration: "5s", target: 0 }
    ],
    thresholds: {
        http_req_duration: ["p(95)<100", "avg<100"],
        check_success_rate: ["rate>0.9"],
        "http_req_duration{staticAsset:yes}": ["p(95)<50"],
    }
};

export default function() {
    group("Front page", function() {
        let res = http.get("http://test.loadimpact.com/");
        let passOrFail = check(res, {
            "is status 200": (r) => r.status === 200,
            "is body length 1176 bytes": (r) => r.body.length === 1176
        });
        checkSuccessRate.add(passOrFail);

        group("Static assets", function() {
            let res = http.batch([
                ["GET", "http://test.loadimpact.com/style.css", { tags: { staticAsset: "yes"} }],
                ["GET", "http://test.loadimpact.com/images/logo.png", { tags: { staticAsset: "yes"} }]
            ]);
            check(res[0], {
                "is status 200": (r) => r.status === 200
            });
            check(res[1], {
                "is status 200": (r) => r.status === 200
            });
        });

        sleep(3);
    });
}