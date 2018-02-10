## REST API

### /create 
Post for create new CNAME for current user.
``` Javascript
{
	name: 'Sample'
}
```
### /update
Update the CNAME, post CNAME object.
### /adminUpdate
Update the CNAME, post CNAME object, also update moderators.
### /remove
Remove the CNAME if user is author