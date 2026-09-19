<script>
  export let name = "arrow-right";
  export let size = 20;
  export let stroke = 1.7;
  const paths = {
    "arrow-right": "M4 12h16m-6-6 6 6-6 6",
    "arrow-up-right": "M6 18 18 6M6 6h12v12",
    "arrow-left": "M20 12H4m6-6-6 6 6 6",
    "chevron-down": "m6 9 6 6 6-6",
    "chevron-right": "m9 5 7 7-7 7",
    search: "m21 21-5-5M18 10a8 8 0 1 1-16 0 8 8 0 0 1 16 0",
    location:
      "M20 10c0 6-8 12-8 12S4 16 4 10a8 8 0 1 1 16 0ZM15 10a3 3 0 1 1-6 0 3 3 0 0 1 6 0",
    bookmark: "M6 3h12v18l-6-4-6 4V3Z",
    check: "m5 12 4 4L19 6",
    shield: "m12 2 8 3v6c0 5-4 9-8 11-4-2-8-6-8-11V5l8-3Zm-4 10 3 3 5-6",
    briefcase: "M8 6V3h8v3M3 6h18v14H3V6Zm0 6c6 4 12 4 18 0M10 12h4v4h-4v-4",
    globe:
      "M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0ZM3 12h18M12 3c5 5 5 13 0 18-5-5-5-13 0-18Z",
    clock: "M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0ZM12 7v5l3 2",
    money: "M2 6h20v12H2V6Zm13 6a3 3 0 1 1-6 0 3 3 0 0 1 6 0M5 9h.01M19 15h.01",
    filter: "M4 6h16M7 12h10M10 18h4",
    close: "m6 6 12 12M6 18 18 6",
    grid: "M3 3h7v7H3V3Zm11 0h7v7h-7V3ZM3 14h7v7H3v-7Zm11 0h7v7h-7v-7",
    list: "M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01",
    menu: "M4 6h16M4 12h16M4 18h16",
    plus: "M12 5v14M5 12h14",
    user: "M16 7a4 4 0 1 1-8 0 4 4 0 0 1 8 0ZM4 21v-2a8 8 0 0 1 16 0v2",
    users:
      "M16 21v-2a6 6 0 0 0-12 0v2M14 6a4 4 0 1 1-8 0 4 4 0 0 1 8 0ZM17 3a4 4 0 0 1 0 8M20 14a6 6 0 0 1 2 5v2",
    eye: "M2 12s3-7 10-7 10 7 10 7-3 7-10 7S2 12 2 12ZM15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0",
    lock: "M7 10V7a5 5 0 0 1 10 0v3M5 10h14v11H5V10ZM12 14v3",
    edit: "m16 3 5 5L8 21H3v-5L16 3Zm-2 2 5 5",
    link: "m10 14 4-4M8 16l-2 2a4 4 0 0 1-5-5l5-5a4 4 0 0 1 6 0m0 8a4 4 0 0 0 6 0l5-5a4 4 0 0 0-5-5l-2 2",
    share: "M12 16V2m-5 5 5-5 5 5M5 11H3v10h18V11h-2",
    mail: "M3 5h18v14H3V5Zm0 0 9 8 9-8",
    file: "M14 2H5v20h14V7l-5-5Zm0 0v6h5M8 12h8M8 16h8",
    chart: "M4 3v18h17M8 15l4-5 4 3 5-7",
    heart: "M20 5c-3-3-6-1-8 1-2-2-5-4-8-1-5 5 2 11 8 16 6-5 13-11 8-16Z",
    spark: "m12 3 2.5 6.5L21 12l-6.5 2.5L12 21l-2.5-6.5L3 12l6.5-2.5L12 3Z",
    building:
      "M4 21V3h12v18M16 10h4v11M2 21h20M8 7h4M8 11h4M8 15h4M9 21v-3h2v3",
    laptop: "M5 3h14v13H5V3ZM2 20h20l-3-4H5l-3 4Z",
    sun: "M16 12a4 4 0 1 1-8 0 4 4 0 0 1 8 0ZM12 2v2m0 16v2M2 12h2m16 0h2M5 5l1 1m12 12 1 1M5 19l1-1M18 6l1-1",
    coffee:
      "M4 8h12v9a4 4 0 0 1-4 4H8a4 4 0 0 1-4-4V8Zm12 1h2a3 3 0 1 1 0 6h-2M7 2v3m5-3v3",
    bell: "M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9ZM10 21h4",
    info: "M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0ZM12 11v6M12 7h.01",
    download: "M12 3v12m-5-5 5 5 5-5M4 16v5h16v-5",
    wifi: "M2 8a16 16 0 0 1 20 0M5 12a11 11 0 0 1 14 0M8 16a6 6 0 0 1 8 0M12 20h.01",
  };
</script>

<svg
  width={size}
  height={size}
  viewBox="0 0 24 24"
  fill="none"
  stroke="currentColor"
  stroke-width={stroke}
  stroke-linecap="round"
  stroke-linejoin="round"
  aria-hidden="true"><path d={paths[name] ?? paths["arrow-right"]} /></svg
>
