tsParticles.load("tsparticles", {
    fullScreen: {
      enable: true,
      zIndex: -1
    },
    background: {
      color: {
        value: "#12121b"
      }
    },
    particles: {
      number: {
        value: 50,
        density: {
          enable: true,
          area: 800
        }
      },
      color: {
        value: "#ffffff"
      },
      shape: {
        type: "triangle"
      },
      opacity: {
        value: 0.5
      },
      size: {
        value: 2,
        random: true
      },
      links: {
        enable: true,
        distance: 130,
        color: "#ffffff",
        opacity: 0.15,
        width: 1
      },
      move: {
        enable: true,
        speed: .2,
        direction: "none",
        outModes: {
          default: "out"
        }
      }
    },
    interactivity: {
      events: {
        onHover: {
          enable: true,
          mode: "repulse"
        },
        onClick: {
          enable: true,
          mode: "push"
        },
        resize: true
      },
      modes: {
        repulse: {
          distance: 50,
          duration: 0.4
        },
        push: {
          quantity: 4
        }
      }
    },
    detectRetina: true
  });