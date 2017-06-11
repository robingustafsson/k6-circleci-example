import { check, group, sleep } from "k6";
import http from "k6/http";
import { Rate } from "k6/metrics";

export let checkFailureRate = new Rate("check_failure_rate");

export let options = {
    stages: [
        { duration: "5s", target: 10 },
        { duration: "5s"},
        { duration: "5s", target: 0 }
    ],
    thresholds: {
        http_req_duration: ["p(95)<500"],
        "http_req_duration{staticAsset:yes}": ["p(95)<200"],
        check_failure_rate: ["rate<3"]
    }
};

export default function() {
    group("Front page", function() {
        let res = http.get("http://test.loadimpact.com/");
        check(res, {
            "is status 200": (r) => r.status === 200,
            "is body size 1176 bytes": (r) => r.body.length === 1176
        }) || checkFailureRate.add(1);

        group("Static assets", function() {
            let res = http.batch([
                ["GET", "http://test.loadimpact.com/style.css", { tags: { staticAsset: "yes" } }],
                ["GET", "http://test.loadimpact.com/images/logo.png", { tags: { staticAsset: "yes" } }]
            ]);
            check(res[0], {
                "is status 200": (r) => r.status === 200
            });
        });

        sleep(3);
    });
}
