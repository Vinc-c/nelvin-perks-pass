/** @type {import('tailwindcss').Config} */
module.exports = {
    darkMode: ["class"],
    content: ["./index.html", "./src/**/*.{ts,tsx,js,jsx}"],
    safelist: [
        { pattern: /bg-(emerald|rose|amber|blue|purple)-50/, },
        { pattern: /bg-(emerald|rose|amber|blue|purple)-500\/15/, },
        { pattern: /text-(emerald|rose|amber|blue|purple)-(400|600)/, },
        { pattern: /border-(amber|emerald)-500\/30/, },
        { pattern: /border-(emerald|rose|amber|blue|purple)-500/, },
        { pattern: /bg-amber-500\/5/, },
        { pattern: /bg-amber-500\/(10|15|20)/, },
        { pattern: /text-amber-(400|700|900)/, },
        { pattern: /bg-emerald-500\/(5|15)/, },
        { pattern: /bg-rose-500\/(15|25)/, },
        { pattern: /text-rose-400/, },
        { pattern: /accent-(emerald|blue|amber)-500/, },
    ],
  theme: {
  	extend: {
  		opacity: Object.fromEntries(Array.from({ length: 101 }, (_, i) => [i, `${i / 100}`])),
  		borderRadius: {
  			lg: 'var(--radius)',
  			md: 'calc(var(--radius) - 2px)',
  			sm: 'calc(var(--radius) - 4px)'
  		},
  		colors: {
  			background: 'hsl(var(--background))',
  			foreground: 'hsl(var(--foreground))',
  			card: {
  				DEFAULT: 'hsl(var(--card))',
  				foreground: 'hsl(var(--card-foreground))'
  			},
  			popover: {
  				DEFAULT: 'hsl(var(--popover))',
  				foreground: 'hsl(var(--popover-foreground))'
  			},
  			primary: {
  				DEFAULT: 'hsl(var(--primary))',
  				foreground: 'hsl(var(--primary-foreground))'
  			},
  			secondary: {
  				DEFAULT: 'hsl(var(--secondary))',
  				foreground: 'hsl(var(--secondary-foreground))'
  			},
  			muted: {
  				DEFAULT: 'hsl(var(--muted))',
  				foreground: 'hsl(var(--muted-foreground))'
  			},
  			accent: {
  				DEFAULT: 'hsl(var(--accent))',
  				foreground: 'hsl(var(--accent-foreground))'
  			},
  			'nv-deep': '#08261D',
  			'nv-emerald': '#0F4A38',
  			'nv-gold': '#C8A24A',
  			'nv-gold-light': '#E6CF8B',
  			'nv-bronze': '#84631A',
  			'nv-terracotta': '#A8472A',
  			'nv-ivory': '#FAF6EC',
  			'nv-ivory-2': '#F2EBDA',
  			'nv-line': '#E4DAC3',
  			'nv-ink': '#14201B',
  			'nv-muted': '#55625B',
  			gold: {
  				DEFAULT: 'hsl(var(--gold))',
  				foreground: 'hsl(var(--gold-foreground))'
  			},
  			brand: {
  				DEFAULT: 'hsl(var(--brand))',
  				foreground: 'hsl(var(--brand-foreground))'
  			},
  			slate: {
  				50: '#FBF8F0', 100: '#F4EEDF', 200: '#E8DFCB', 300: '#D3C7AC', 400: '#8E968F',
  				500: '#5F6B64', 600: '#4A564F', 700: '#35413B', 800: '#1F2E27', 900: '#14201B', 950: '#0B1612'
  			},
  			emerald: {
  				50: '#EAF3EE', 100: '#D2E7DC', 200: '#A8CFBB', 300: '#74B096', 400: '#3F8F72',
  				500: '#0F4A38', 600: '#0B3A2C', 700: '#08261D', 800: '#061C15', 900: '#04130E'
  			},
  			amber: {
  				50: '#FBF5E3', 100: '#F4E8C3', 200: '#EBD79A', 300: '#E6CF8B', 400: '#C8A24A',
  				500: '#84631A', 600: '#6F5314', 700: '#5A430F', 800: '#43320B', 900: '#2E2208'
  			},
  			blue: {
  				500: '#14B8D2',
  				600: '#00A7C4',
  				700: '#0089A3',
  				800: '#006B82',
  				900: '#005568'
  			},
  			indigo: {
  				800: '#0089A3'
  			},
  			destructive: {
  				DEFAULT: 'hsl(var(--destructive))',
  				foreground: 'hsl(var(--destructive-foreground))'
  			},
  			border: 'hsl(var(--border))',
  			input: 'hsl(var(--input))',
  			ring: 'hsl(var(--ring))',
  			chart: {
  				'1': 'hsl(var(--chart-1))',
  				'2': 'hsl(var(--chart-2))',
  				'3': 'hsl(var(--chart-3))',
  				'4': 'hsl(var(--chart-4))',
  				'5': 'hsl(var(--chart-5))'
  			},
  			sidebar: {
  				DEFAULT: 'hsl(var(--sidebar-background))',
  				foreground: 'hsl(var(--sidebar-foreground))',
  				primary: 'hsl(var(--sidebar-primary))',
  				'primary-foreground': 'hsl(var(--sidebar-primary-foreground))',
  				accent: 'hsl(var(--sidebar-accent))',
  				'accent-foreground': 'hsl(var(--sidebar-accent-foreground))',
  				border: 'hsl(var(--sidebar-border))',
  				ring: 'hsl(var(--sidebar-ring))'
  			}
  		},
  		fontFamily: {
  			heading: ['var(--font-heading)'],
  			body: ['var(--font-body)'],
  			display: ['var(--font-display)'],
  			mono: ['var(--font-mono)']
  		},
  		keyframes: {
  			'accordion-down': {
  				from: {
  					height: '0'
  				},
  				to: {
  					height: 'var(--radix-accordion-content-height)'
  				}
  			},
  			'accordion-up': {
  				from: {
  					height: 'var(--radix-accordion-content-height)'
  				},
  				to: {
  					height: '0'
  				}
  			}
  		},
  		animation: {
  			'accordion-down': 'accordion-down 0.2s ease-out',
  			'accordion-up': 'accordion-up 0.2s ease-out'
  		}
  	}
  },
  plugins: [require("tailwindcss-animate")],
}
