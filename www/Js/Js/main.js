"use strict";

document.addEventListener(
    "DOMContentLoaded",
    () => {

        const menu =
            document.getElementById(
                "menuBtn"
            );

        const mobileNav =
            document.getElementById(
                "mobileNav"
            );


        if (
            menu &&
            mobileNav
        ) {

            menu.addEventListener(
                "click",
                () => {

                    mobileNav.classList.toggle(
                        "open"
                    );

                }
            );


            mobileNav
                .querySelectorAll("a")
                .forEach(
                    link => {

                        link.addEventListener(
                            "click",
                            () => {

                                mobileNav.classList.remove(
                                    "open"
                                );

                            }
                        );

                    }
                );

        }


        const animated =
            document.querySelectorAll(
                ".solution-card,.solution-feature,.platform-section,.network-stats div"
            );


        const observer =
            new IntersectionObserver(
                entries => {

                    entries.forEach(
                        entry => {

                            if (
                                entry.isIntersecting
                            ) {

                                entry.target.classList.add(
                                    "reveal-visible"
                                );

                                observer.unobserve(
                                    entry.target
                                );

                            }

                        }
                    );

                },
                {
                    threshold:.10
                }
            );


        animated.forEach(
            item => {

                item.classList.add(
                    "reveal"
                );

                observer.observe(
                    item
                );

            }
        );

    }
);