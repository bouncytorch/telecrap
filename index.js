require('dotenv').config();
const { Telegraf, Scenes, session } = require('telegraf'), firebase = require('firebase-admin'), bcrypt = require('bcrypt'),
	cert = require('./cert.json'),
	base = firebase.initializeApp({
		credential: firebase.credential.cert(cert),
		databaseURL: process.env.DBURL
	}), db = base.database(), app = new Telegraf(process.env.TOKEN), sesStore = new Map();

const Start = new Scenes.WizardScene(
		'Start',
		(ctx) => {
			if (ctx.session && 'loggedin' in ctx.session) return ctx.scene.enter('Image', ctx.wizard.state);
			ctx.replyWithMarkdownV2(`welcome to **telecrap**\\. an example telegraf bot by @bobsytoch
more info at https://bouncytorch\\.xyz/
this bot is a substitute for a login system\\. the app will generate you a random avatar

_custom images humbly provided by https://thispersondoesnotexist\\.com/_`);
			ctx.replyWithMarkdownV2(`To start, type out your email here: 

_E\\-mail addresses are not used for advertisement purposes or shared with third parties\\._`);
			ctx.wizard.state.data = {};
			return ctx.wizard.next();
		},
		async (ctx) => {
			if (!('text' in ctx.message)) {
				return ctx.replyWithMarkdownV2(`The email is invalid\\. Try again: 

			_E\\-mail addresses are not used for advertisement purposes or shared with third parties\\._`); 
			}
			else {
				const val = await require('deep-email-validator').validate(ctx.message.text);
				if (!val.valid) return ctx.replyWithMarkdownV2(`The e\\-mail is invalid\\. Try again: 

_E\\-mail addresses are not used for advertisement purposes or shared with third parties\\._`);
				ctx.wizard.state.data.email = ctx.message.text; 
				return ctx.scene.enter('EmailCheck', ctx.wizard.state);
			}
		},
	), 
	EmailCheck = new Scenes.WizardScene(
		'EmailCheck',
		(ctx) => {
			db.ref('users').on('value', (snapshot) => {
				console.log(snapshot.val());
				if (snapshot.val() == null || typeof snapshot.val() == 'string' || !(ctx.wizard.state.data.email in snapshot.val())) {
					snapshot.ref.set({});
					ctx.replyWithMarkdownV2(`You are creating a new account\\.
			
Enter your password: `);
					ctx.wizard.state.q = 'new';
					return ctx.wizard.next();
				}
				else {
					ctx.replyWithMarkdownV2(`You are entering an existing account\\.
			
Enter your password:`);
					return ctx.wizard.next();
				}
			}, (errorObject) => {
				console.log('The read failed: ' + errorObject.name);
			});
		},
		(ctx) => {
			if (ctx.wizard.state.q == 'new') ctx.scene.enter('PasswordNew', ctx.wizard.state);
			else ctx.scene.enter('Password', ctx.wizard.state);
		}
	),
	PasswordNew = new Scenes.WizardScene(
		'PasswordNew',
		(ctx) => {
			if (!('text' in ctx.message) || ctx.message.text < 8) return ctx.replyWithMarkdownV2(`Invalid password\\. It must be more or equal to 8 characters

Try again:`);
			ctx.wizard.state.data.password = ctx.message.text;
			ctx.replyWithMarkdownV2('Confirm your password:');
			return ctx.wizard.next();
		},
		(ctx) => {
			if (!('text' in ctx.message) || ctx.message.text != ctx.wizard.state.data.password) return ctx.replyWithMarkdownV2(`Passwords not matching\\.

Try again:`);
			ctx.wizard.state.data.password = bcrypt.hashSync(ctx.message.text, bcrypt.genSaltSync(12));
			db.ref('users').on('value', (snapshot) => {
				snapshot.ref.set({
					...snapshot.val(),
					[ctx.wizard.state.data.email]: ctx.wizard.state.data.password
				}).then(() => ctx.scene.enter('Image', ctx.wizard.state));
			}, (errorObject) => {
				console.log('The read failed: ' + errorObject.name);
				return;
			});
			return ctx.scene.enter('Image', ctx.wizard.state);
		}
	),
	Password = new Scenes.WizardScene(
		'Password',
		(ctx) => {
			db.ref('users').on('value', (snapshot) => {
				if (!('text' in ctx.message) || ctx.message.text < 8 || bcrypt.compareSync(ctx.message.text, snapshot.val()[ctx.wizard.state.data.email])) return ctx.replyWithMarkdownV2(`Invalid password\\.

Try again:`);
				return ctx.scene.enter('Image', ctx.wizard.state);
			}, (errorObject) => {
				console.log('The read failed: ' + errorObject.name);
				return;
			});
		}
	),
	Image = new Scenes.WizardScene(
		'Image',
		(ctx) => {
			ctx.session.loggedin = ctx.session.loggedin || ctx.wizard.state.data.email;
			ctx.replyWithPhoto({ url: 'https://thispersondoesnotexist.com' }, { caption: `Sucess\\! Here's your info:\n\nEmail: ${ctx.session.loggedin.replace('.', '\\.')}`, parse_mode: 'MarkdownV2' });
			return ctx.scene.leave();
		}
	);

app.use(session({ store: sesStore }));
app.use((new Scenes.Stage([Start, EmailCheck, PasswordNew, Password, Image])).middleware());
app.start((ctx) => ctx.scene.enter('Start'));
app.command('stop', (ctx) => { ctx.session = null; return ctx.leaveChat(); });

app.launch();