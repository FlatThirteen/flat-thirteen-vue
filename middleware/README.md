# MIDDLEWARE

This directory contains your Application Middleware.
The middleware lets you define custom function to be ran before rendering a page or a group of pages (layouts).

More information about the usage of this directory in the documentation:
https://nuxtjs.org/guide/routing#middleware

**This directory is not required, you can delete it if you don't want to use it.**

trigger('show', [
      transition(':enter', [
        query('.pitched', animate(100, keyframes([
            style({ transform: 'scale(1.2, .8)', opacity: 0 }),
            style({ transform: 'scale(1)', opacity: 1 })
          ])), { optional: true }),
        query('.unpitched', animate(250, keyframes([
            style({ transform: 'scale(0.8)', opacity: 0.5, offset: 0 }),
            style({ transform: 'scale(2)', opacity: 1, offset: 0.3 }),
            style({ transform: 'scale(2.5)', opacity: 0.7, offset: 1 }),
        ])), { optional: true })
      ]),
      transition(':leave', [
        /* TODO: Performance sucks!
        query('.shadow',
          animate(140, keyframes([
            style({ opacity: 0, offset: 0 }),
            style({ opacity: 1, offset: 1 })
          ])), { optional: true })*/
        query('.pitched',
          animate(140, keyframes([
            style({ transform: 'translateY(0) scale(1)', opacity: 1 }),
            style({ transform: 'translateY(20vh) scale(3, 1.5)', opacity: 0.3 })
          ])), { optional: true }),
        query('.cowbell',
          animate(140, keyframes([
            style({ transform: 'scale(1)', opacity: 0.5 }),
            style({ transform: 'scale(3)', opacity: 0.1 })
          ])), { optional: true })
      ])
    ])
