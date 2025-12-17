"use strict";
(() => {
  var __getOwnPropNames = Object.getOwnPropertyNames;
  var __commonJS = (cb, mod) => function __require() {
    return mod || (0, cb[__getOwnPropNames(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
  };

  // src/renderer/main.ts
  var require_main = __commonJS({
    "src/renderer/main.ts"() {
      var historyEntries = [];
      var isLoggedIn = false;
      var query = (id) => {
        const element = document.getElementById(id);
        if (!element) {
          throw new Error(`Element with id "${id}" not found`);
        }
        return element;
      };
      var loginBtn = query("login-btn");
      var loginStatus = query("login-status");
      var reviewForm = query("review-form");
      var reviewLog = query("review-log");
      var bulkForm = query("bulk-form");
      var bulkLog = query("bulk-log");
      var historyList = query("history-list");
      var toTimestamp = () => (/* @__PURE__ */ new Date()).toLocaleString();
      var renderHistory = () => {
        historyList.innerHTML = "";
        historyEntries.forEach((item) => {
          const li = document.createElement("li");
          const detailText = item.detail ? ` \xB7 ${item.detail}` : "";
          li.textContent = `${item.type} \xB7 ${item.status} \xB7 ${item.timestamp}${detailText}`;
          historyList.appendChild(li);
        });
      };
      var appendHistory = (entry) => {
        historyEntries.unshift(entry);
        renderHistory();
      };
      var parseReviewInput = () => {
        const product = query("product-select").value;
        const scoreInput = query("score").value;
        const text = query("review-text").value.trim();
        const score = Number(scoreInput);
        if (!product || !text || Number.isNaN(score)) {
          reviewLog.textContent = "\uC0C1\uD488, \uB9AC\uBDF0 \uB0B4\uC6A9, \uBCC4\uC810\uC744 \uBAA8\uB450 \uC785\uB825\uD558\uC138\uC694.";
          return null;
        }
        if (score < 1 || score > 5) {
          reviewLog.textContent = "\uBCC4\uC810\uC740 1~5 \uC0AC\uC774\uC5EC\uC57C \uD569\uB2C8\uB2E4.";
          return null;
        }
        return { product, score, text };
      };
      loginBtn.addEventListener("click", () => {
        isLoggedIn = !isLoggedIn;
        loginStatus.textContent = isLoggedIn ? "\uB85C\uADF8\uC778 \uC644\uB8CC (mock)" : "\uB85C\uADF8\uC544\uC6C3 \uC0C1\uD0DC";
        loginStatus.classList.toggle("active", isLoggedIn);
      });
      reviewForm.addEventListener("submit", (event) => {
        event.preventDefault();
        const reviewInput = parseReviewInput();
        if (!reviewInput) {
          return;
        }
        reviewLog.textContent = `\uB9AC\uBDF0 \uB4F1\uB85D \uC694\uCCAD \uC911\u2026 (\uC0C1\uD488: ${reviewInput.product}, \uBCC4\uC810: ${reviewInput.score})`;
        window.setTimeout(() => {
          reviewLog.textContent = "\uC131\uACF5: \uB9AC\uBDF0\uAC00 \uB4F1\uB85D\uB418\uC5C8\uC2B5\uB2C8\uB2E4. (Mock \uC751\uB2F5)";
          appendHistory({
            type: "\uB2E8\uAC74 \uC5C5\uB85C\uB4DC",
            status: "\uC131\uACF5",
            timestamp: toTimestamp(),
            detail: reviewInput.product
          });
          reviewForm.reset();
        }, 600);
      });
      bulkForm.addEventListener("submit", (event) => {
        var _a;
        event.preventDefault();
        const fileInput = query("bulk-file");
        const file = (_a = fileInput.files) == null ? void 0 : _a[0];
        if (!file) {
          bulkLog.textContent = "\uC5C5\uB85C\uB4DC\uD560 CSV \uB610\uB294 XLSX \uD30C\uC77C\uC744 \uC120\uD0DD\uD558\uC138\uC694.";
          return;
        }
        bulkLog.textContent = `${file.name} \uCC98\uB9AC \uC911\u2026`;
        window.setTimeout(() => {
          bulkLog.textContent = "\uC644\uB8CC: 12\uAC74 \uC5C5\uB85C\uB4DC \uC131\uACF5, 1\uAC74 \uC2E4\uD328 (Mock)";
          appendHistory({
            type: "\uC77C\uAD04 \uC5C5\uB85C\uB4DC",
            status: "\uC644\uB8CC",
            timestamp: toTimestamp(),
            detail: file.name
          });
          fileInput.value = "";
        }, 900);
      });
    }
  });
  require_main();
})();
