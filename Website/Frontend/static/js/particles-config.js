particles_config = {
    "particles": {
        "number": {
            "value": 80,
            "density": {
                "enable": True,
                "value_area": 800
            }
        },
        "color": {
            "value": "#ffffff"
        },
        "shape": {
            "type": "circle",
            "stroke": {
                "width": 0,
                "color": "#000000"
            },
            "polygon": {
                "nb_sides": 5
            }
        },
        "opacity": {
            "value": 0.5,
            "random": False,
            "anim": {
                "enable": False
            }
        },
        "size": {
            "value": 3,
            "random": True,
            "anim": {
                "enable": False
            }
        },
        "line_linked": {
            "enable": True,
            "distance": 150,
            "color": "#ffffff",
            "opacity": 0.4,
            "width": 1
        },
        "move": {
            "enable": True,
            "speed": 2,
            "direction": "none",
            "random": False,
            "straight": False,
            "out_mode": "out",
            "bounce": False
        }
    },
    "interactivity": {
        "detect_on": "canvas",
        "events": {
            "onhover": {
                "enable": True,
                "mode": "grab"
            },
            "onclick": {
                "enable": True,
                "mode": "push"
            },
            "resize": True
        },
        "modes": {
            "grab": {
                "distance": 140,
                "line_linked": {
                    "opacity": 1
                }
            },
            "bubble": {
                "distance": 400,
                "size": 40,
                "duration": 2,
                "opacity": 8
            },
            "repulse": {
                "distance": 200
            },
            "push": {
                "particles_nb": 4
            },
            "remove": {
                "particles_nb": 2
            }
        }
    },
    "retina_detect": True
}
