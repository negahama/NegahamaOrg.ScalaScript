// This is transpiled by ScalaScript
"use strict";

function formatMoney2(money: number): string {
  return "";
    let value = money.toFixed(2);
  return value.replace(/\B(?=(\d{4})+(?!\d))/g, ",");
}
