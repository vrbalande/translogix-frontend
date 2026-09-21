"use strict";

document.addEventListener(
    "DOMContentLoaded",
    () => {

        const header =
            document.querySelector(
                ".site-header"
            );


        if (!header) {
            return;
        }


        function updateHeader() {

            if (
                window.scrollY >
                10
            ) {

                header.classList.add(
                    "scrolled"
                );

            }
            else {

                header.classList.remove(
                    "scrolled"
                );

            }

        }


        window.addEventListener(
            "scroll",
            updateHeader,
            {
                passive:true
            }
        );


        updateHeader();


        document
            .querySelectorAll(
                'a[href^="#"]'
            )
            .forEach(
                link => {

                    link.addEventListener(
                        "click",
                        event => {

                            const selector =
                                link.getAttribute(
                                    "href"
                                );


                            if (
                                !selector ||
                                selector === "#"
                            ) {
                                return;
                            }


                            const target =
                                document.querySelector(
                                    selector
                                );


                            if (!target) {
                                return;
                            }


                            event.preventDefault();


                            target.scrollIntoView(
                                {
                                    behavior:"smooth",
                                    block:"start"
                                }
                            );

                        }
                    );

                }
            );

    }
);